import { AlertTriangle } from "lucide-react";

export function DevelopTenantBanner({ tenantName }: { tenantName: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 sm:px-6">
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      <p>
        開発者モード: <span className="font-medium">{tenantName}</span>{" "}
        のデータを参照中です（所属テナント外）
      </p>
    </div>
  );
}
