import { NextResponse } from "next/server";
import { syncJobs } from "@/lib/jobs/sync-jobs";
import { notifyJobSyncToSlack } from "@/lib/notifications/slack";

/** 1タブ同期用（GitHub Actions はタブごとに呼び出す） */
export const maxDuration = 300;
export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") ?? undefined;
    const companyKey = searchParams.get("companyKey") ?? undefined;

    const result = await syncJobs({ tenantId, companyKey });

    if (!result.configured) {
      return NextResponse.json({
        ok: false,
        error: "Job sync is not configured",
        tenantId: result.tenantId,
      });
    }

    for (const row of result.results) {
      try {
        await notifyJobSyncToSlack({
          displayName: row.displayName,
          companyKey: row.companyKey,
          importedCount: row.importedCount,
          successCount: row.successCount,
          failedCount: row.failedCount,
          skippedClosedCount: row.skippedClosedCount,
        });
      } catch (slackError) {
        console.error("[cron/job-sync] Slack notification failed:", slackError);
      }
    }

    return NextResponse.json({
      ok: true,
      tenantId: result.tenantId,
      companies: result.companies,
      results: result.results.map((r) => ({
        companyKey: r.companyKey,
        displayName: r.displayName,
        importedCount: r.importedCount,
        successCount: r.successCount,
        failedCount: r.failedCount,
        importLogId: r.importLogId,
      })),
    });
  } catch (error) {
    console.error("[cron/job-sync]", error);
    return NextResponse.json(
      { error: "Job sync failed", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      tenantId?: string;
      companyKey?: string;
    };

    const result = await syncJobs({
      tenantId: body.tenantId,
      companyKey: body.companyKey,
    });

    if (result.configured) {
      for (const row of result.results) {
        try {
          await notifyJobSyncToSlack({
            displayName: row.displayName,
            companyKey: row.companyKey,
            importedCount: row.importedCount,
            successCount: row.successCount,
            failedCount: row.failedCount,
            skippedClosedCount: row.skippedClosedCount,
          });
        } catch (slackError) {
          console.error("[cron/job-sync] Slack notification failed:", slackError);
        }
      }
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/job-sync]", error);
    return NextResponse.json(
      { error: "Job sync failed", detail: String(error) },
      { status: 500 }
    );
  }
}
