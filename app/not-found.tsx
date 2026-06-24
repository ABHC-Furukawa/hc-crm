import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <Button asChild>
        <Link href="/dashboard">ダッシュボードへ</Link>
      </Button>
    </div>
  );
}
