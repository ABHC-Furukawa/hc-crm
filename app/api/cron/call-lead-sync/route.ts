import { NextResponse } from "next/server";
import { syncCallLeads } from "@/lib/call-leads/sync-call-leads";

/** 大量 chunk 取込用（Vercel Pro 上限に合わせる） */
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

    const result = await syncCallLeads({ tenantId });

    if (!result.configured) {
      return NextResponse.json({
        ok: false,
        error: "CallLead sync is not configured",
        tenantId: result.tenantId,
      });
    }

    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error, tenantId: result.tenantId },
        { status: 500 }
      );
    }

    const imp = result.import!;
    return NextResponse.json({
      ok: true,
      tenantId: result.tenantId,
      importLogId: imp.importLogId,
      importedCount: imp.importedCount,
      createdCount: imp.createdCount,
      updatedCount: imp.updatedCount,
      duplicateCount: imp.duplicateCount,
      outOfScopeCount: imp.outOfScopeCount,
      skippedCount: imp.skippedCount,
      failedCount: imp.failedCount,
      syncWindow: imp.syncWindow ?? null,
    });
  } catch (error) {
    console.error("[cron/call-lead-sync]", error);
    return NextResponse.json(
      { error: "CallLead sync failed", detail: String(error) },
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
    };

    const result = await syncCallLeads({ tenantId: body.tenantId });

    if (!result.configured) {
      return NextResponse.json({
        ok: false,
        error: "CallLead sync is not configured",
        tenantId: result.tenantId,
      });
    }

    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error, tenantId: result.tenantId },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, tenantId: result.tenantId, import: result.import });
  } catch (error) {
    console.error("[cron/call-lead-sync]", error);
    return NextResponse.json(
      { error: "CallLead sync failed", detail: String(error) },
      { status: 500 }
    );
  }
}
