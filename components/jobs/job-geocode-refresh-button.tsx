"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { refreshJobGeocodesAction } from "@/lib/actions/jobs";
import { Button } from "@/components/ui/button";

export function JobGeocodeRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await refreshJobGeocodesAction();
          router.refresh();
        });
      }}
    >
      {pending ? "更新中…" : "座標を更新"}
    </Button>
  );
}
