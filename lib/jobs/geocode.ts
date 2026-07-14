import { prisma } from "@/lib/prisma";

export type GeocodeResult =
  | { ok: true; latitude: number; longitude: number; status: "OK" }
  | { ok: false; status: "ZERO_RESULTS" | "ERROR"; message?: string };

function getGeocodingApiKey(): string | null {
  const key =
    process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return key || null;
}

export function isGeocodingConfigured(): boolean {
  return getGeocodingApiKey() != null;
}

export function isGoogleMapsDisplayConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
}

/** Google Geocoding API — 日本バイアス */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = getGeocodingApiKey();
  if (!apiKey) {
    return { ok: false, status: "ERROR", message: "Geocoding API key not configured" };
  }

  const query = address.trim();
  if (!query) {
    return { ok: false, status: "ZERO_RESULTS" };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "ja");
  url.searchParams.set("region", "jp");

  try {
    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      return {
        ok: false,
        status: "ERROR",
        message: `HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      status: string;
      error_message?: string;
      results?: { geometry?: { location?: { lat: number; lng: number } } }[];
    };

    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return { ok: true, latitude: lat, longitude: lng, status: "OK" };
    }

    if (data.status === "ZERO_RESULTS") {
      return { ok: false, status: "ZERO_RESULTS" };
    }

    return {
      ok: false,
      status: "ERROR",
      message: data.error_message ?? data.status,
    };
  } catch (error) {
    return {
      ok: false,
      status: "ERROR",
      message: error instanceof Error ? error.message : "geocode failed",
    };
  }
}

const DEFAULT_BATCH = 25;
const DELAY_MS = 120;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 未ジオコード or location 変更分を最大 limit 件処理する。
 * 失敗しても呼び出し元の同期は止めない。
 */
export async function geocodePendingJobsForTenant(
  tenantId: string,
  limit = DEFAULT_BATCH
): Promise<{ processed: number; ok: number; failed: number }> {
  if (!isGeocodingConfigured()) {
    return { processed: 0, ok: 0, failed: 0 };
  }

  const candidates = await prisma.job.findMany({
    where: {
      tenantId,
      AND: [{ location: { not: null } }, { NOT: { location: "" } }],
    },
    select: {
      id: true,
      location: true,
      latitude: true,
      longitude: true,
      geocodeQuery: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });

  const pending = candidates
    .filter((job) => {
      const location = job.location?.trim() ?? "";
      if (!location) return false;
      if (job.latitude == null || job.longitude == null) return true;
      if (job.geocodeQuery !== location) return true;
      return false;
    })
    .slice(0, limit);

  let ok = 0;
  let failed = 0;

  for (const job of pending) {
    const location = job.location!.trim();
    const result = await geocodeAddress(location);

    if (result.ok) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          latitude: result.latitude,
          longitude: result.longitude,
          geocodedAt: new Date(),
          geocodeStatus: "OK",
          geocodeQuery: location,
        },
      });
      ok += 1;
    } else {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          latitude: null,
          longitude: null,
          geocodedAt: new Date(),
          geocodeStatus: result.status,
          geocodeQuery: location,
        },
      });
      failed += 1;
    }

    await sleep(DELAY_MS);
  }

  return { processed: pending.length, ok, failed };
}
