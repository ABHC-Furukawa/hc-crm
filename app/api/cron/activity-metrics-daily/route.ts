import { NextResponse } from "next/server";
import {
  parseSyncRangeFromRequest,
  syncActivityMetricsDaily,
} from "@/lib/kpi/sync-activity-metrics-daily";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      days?: number;
      from?: string;
      to?: string;
      tenantId?: string;
    };

    const range = parseSyncRangeFromRequest(body);
    const result = await syncActivityMetricsDaily({
      from: range.from,
      to: range.to,
      tenantId: body.tenantId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/activity-metrics-daily]", error);
    return NextResponse.json(
      { error: "Sync failed", detail: String(error) },
      { status: 500 }
    );
  }
}

/** GitHub Actions / curl 用。body 省略時は昨日 1 日分 */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = parseSyncRangeFromRequest({
      days: searchParams.get("days")
        ? Number(searchParams.get("days"))
        : undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    const tenantId = searchParams.get("tenantId") ?? undefined;

    const result = await syncActivityMetricsDaily({
      from: range.from,
      to: range.to,
      tenantId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/activity-metrics-daily]", error);
    return NextResponse.json(
      { error: "Sync failed", detail: String(error) },
      { status: 500 }
    );
  }
}
