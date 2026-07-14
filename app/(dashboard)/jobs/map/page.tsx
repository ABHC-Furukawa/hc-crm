import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getJobsForMap } from "@/lib/actions/jobs";
import { parseJobFilters } from "@/lib/jobs/filters";
import { canManageTenantSettings } from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { JobsMap } from "@/components/jobs/jobs-map";
import { JobGeocodeRefreshButton } from "@/components/jobs/job-geocode-refresh-button";
import { Button } from "@/components/ui/button";

function buildMapQuery(
  params: Record<string, string | string[] | undefined>,
  patch: Record<string, string | undefined>
) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0 && key !== "page") {
      next.set(key, value);
    }
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/jobs/map?${qs}` : "/jobs/map";
}

export default async function JobsMapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseJobFilters(params);
  const [{ user }, mapData] = await Promise.all([
    requireTenantContext(),
    getJobsForMap(params),
  ]);
  const canRefresh = canManageTenantSettings(user.role);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  return (
    <>
      <DashboardHeader title="案件マップ" />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                案件管理に戻る
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              ピン {mapData.markers.length} 件
              {mapData.truncated ? `（表示上限あり・対象 ${mapData.totalMatched} 件）` : ""}
              {mapData.pendingGeocodeCount > 0
                ? ` · 座標待ち ${mapData.pendingGeocodeCount}`
                : ""}
              {mapData.failedGeocodeCount > 0
                ? ` · 変換失敗 ${mapData.failedGeocodeCount}`
                : ""}
              {mapData.noLocationCount > 0
                ? ` · 勤務地なし ${mapData.noLocationCount}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={filters.openOnly ? "default" : "outline"}
              size="sm"
            >
              <Link
                href={buildMapQuery(params, {
                  openOnly: filters.openOnly ? undefined : "1",
                })}
              >
                {filters.openOnly ? "募集中のみ（ON）" : "募集中のみ"}
              </Link>
            </Button>
            {canRefresh && mapData.geocodingConfigured && (
              <JobGeocodeRefreshButton />
            )}
          </div>
        </div>

        {!mapData.mapsConfigured ? (
          <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Google Maps API キーが未設定です</p>
            <p className="mt-2">
              Vercel / .env に{" "}
              <code className="rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
              を設定し、Maps JavaScript API と Geocoding API を有効化してください。
            </p>
          </div>
        ) : mapData.markers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            表示できるピンがありません。勤務地のジオコードが未完了、またはフィルタ対象に座標付き案件がありません。
            {mapData.geocodingConfigured && canRefresh && (
              <span> 「座標を更新」で変換を再実行できます。</span>
            )}
            {!mapData.geocodingConfigured && (
              <span>
                {" "}
                Geocoding 用に{" "}
                <code className="rounded bg-muted px-1">GOOGLE_MAPS_GEOCODING_API_KEY</code>{" "}
                （または同一の Maps キー）も設定してください。
              </span>
            )}
          </div>
        ) : (
          <div className="min-h-[70vh] flex-1">
            <JobsMap apiKey={apiKey} markers={mapData.markers} />
          </div>
        )}
      </main>
    </>
  );
}
