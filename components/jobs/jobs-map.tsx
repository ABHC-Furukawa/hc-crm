"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { JobMapItem } from "@/lib/jobs/queries";

type JobsMapProps = {
  apiKey: string;
  markers: JobMapItem[];
};

type GoogleMapsApi = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: Record<string, unknown>
    ) => {
      fitBounds: (b: unknown, padding?: number) => void;
      setCenter: (c: unknown) => void;
      setZoom: (z: number) => void;
    };
    Marker: new (opts: Record<string, unknown>) => {
      addListener: (event: string, handler: () => void) => void;
      setMap: (map: unknown) => void;
    };
    LatLngBounds: new () => {
      extend: (p: { lat: number; lng: number }) => void;
      getCenter: () => unknown;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window unavailable"));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  const existing = document.querySelector<HTMLScriptElement>(
    "script[data-hc-google-maps]"
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => {
        if (window.google) resolve(window.google);
        else reject(new Error("Google Maps failed to load"));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps script error"))
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.hcGoogleMaps = "1";
    script.onload = () => {
      if (window.google) resolve(window.google);
      else reject(new Error("Google Maps failed to load"));
    };
    script.onerror = () => reject(new Error("Google Maps script error"));
    document.head.appendChild(script);
  });
}

export function JobsMap({ apiKey, markers }: JobsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<JobMapItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const createdMarkers: { setMap: (map: unknown) => void }[] = [];

    async function init() {
      if (!containerRef.current) return;
      try {
        const g = await loadGoogleMaps(apiKey);
        if (cancelled || !containerRef.current) return;

        const center =
          markers.length > 0
            ? { lat: markers[0].latitude, lng: markers[0].longitude }
            : { lat: 35.681236, lng: 139.767125 };

        const map = new g.maps.Map(containerRef.current, {
          center,
          zoom: markers.length > 0 ? 10 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        const bounds = new g.maps.LatLngBounds();

        for (const item of markers) {
          const position = { lat: item.latitude, lng: item.longitude };
          const marker = new g.maps.Marker({
            map,
            position,
            title: item.jobTitle,
          });
          marker.addListener("click", () => setSelected(item));
          createdMarkers.push(marker);
          bounds.extend(position);
        }

        if (markers.length > 1) {
          map.fitBounds(bounds, 48);
        } else if (markers.length === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(12);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "地図の読み込みに失敗しました");
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      for (const m of createdMarkers) m.setMap(null);
    };
  }, [apiKey, markers]);

  return (
    <div className="relative h-full min-h-[480px] w-full overflow-hidden rounded-lg border">
      <div ref={containerRef} className="absolute inset-0" />
      {error && (
        <div className="absolute inset-x-0 top-0 z-10 bg-destructive/90 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}
      {selected && (
        <div className="absolute bottom-3 left-3 right-3 z-10 max-w-md rounded-lg border bg-card p-3 shadow-lg sm:right-auto">
          <p className="font-semibold">{selected.jobTitle}</p>
          <p className="text-sm text-muted-foreground">{selected.companyName}</p>
          <p className="mt-1 text-sm">{selected.location ?? "—"}</p>
          {selected.referralFee && (
            <p className="text-xs text-muted-foreground">
              紹介料: {selected.referralFee}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <Link
              href={`/jobs/${selected.id}`}
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              案件詳細を開く
            </Link>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSelected(null)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
