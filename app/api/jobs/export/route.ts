import { NextResponse } from "next/server";
import { canExportJobsCsv } from "@/lib/auth/rbac";
import { buildJobListCsv, buildJobListCsvFilename } from "@/lib/jobs/export-csv";
import { queryAllJobsForExport } from "@/lib/jobs/queries";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  if (!canExportJobsCsv(ctx.user.role)) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 403 });
  }

  try {
    const jobs = await queryAllJobsForExport(ctx.tenantId);
    const csv = buildJobListCsv(jobs);
    const fileName = buildJobListCsvFilename();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Job CSV export failed:", error);
    return NextResponse.json(
      { error: "CSV の生成に失敗しました" },
      { status: 500 }
    );
  }
}
