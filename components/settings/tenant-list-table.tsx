import Link from "next/link";
import { TenantPlan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { TenantPlanSelect } from "@/components/settings/tenant-plan-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TenantListItem = {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  planLabel: string;
  activeUserCount: number;
  candidateCount: number;
  callLeadCount: number;
};

export function TenantListTable({ tenants }: { tenants: TenantListItem[] }) {
  if (tenants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">テナントがありません</p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>組織名</TableHead>
            <TableHead>slug</TableHead>
            <TableHead>プラン</TableHead>
            <TableHead className="text-right">メンバー</TableHead>
            <TableHead className="text-right">求職者</TableHead>
            <TableHead className="text-right">架電リード</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/settings/tenants/${tenant.id}`}
                  className="hover:underline"
                >
                  {tenant.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {tenant.slug}
              </TableCell>
              <TableCell>
                <TenantPlanSelect tenantId={tenant.id} plan={tenant.plan} />
              </TableCell>
              <TableCell className="text-right">{tenant.activeUserCount}</TableCell>
              <TableCell className="text-right">{tenant.candidateCount}</TableCell>
              <TableCell className="text-right">{tenant.callLeadCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TenantListHeader() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">テナント一覧</h2>
        <p className="text-sm text-muted-foreground">
          DEVELOP ユーザーは組織名から監査ログを確認できます。プラン変更とヘッダーの切替 UI から参照 tenant を変更できます
        </p>
      </div>
      <Button asChild>
        <Link href="/settings/tenants/new">新規テナント</Link>
      </Button>
    </div>
  );
}
