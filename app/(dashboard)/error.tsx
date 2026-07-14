"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">画面の読み込みに失敗しました</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        一時的な不具合の可能性があります。再読み込みをお試しください。
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          再試行
        </Button>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          ページを更新
        </Button>
      </div>
    </div>
  );
}
