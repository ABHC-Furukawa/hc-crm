"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 現在の一覧フィルタを引き継いでマップを別タブで開く */
export function JobsMapOpenButton() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const href = qs ? `/jobs/map?${qs}` : "/jobs/map";

  return (
    <Button asChild variant="outline" className="w-full sm:w-auto">
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <Map className="mr-2 h-4 w-4" />
        マップで見る
      </Link>
    </Button>
  );
}
