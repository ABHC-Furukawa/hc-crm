import { NextResponse } from "next/server";
import { AccessDeniedError } from "@/lib/auth/access";
import { callService } from "@/lib/calls/call-service";
import { CallServiceError } from "@/lib/calls/types";
import { assertCallLeadAccess } from "@/lib/tenant/access";
import { getTenantContext } from "@/lib/tenant/context";
import { initiateCallSchema } from "@/lib/validators/call-attempt";

export async function POST(request: Request) {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = initiateCallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "リクエストが不正です" },
        { status: 400 }
      );
    }

    const { callLeadId, provider } = parsed.data;
    const { user, tenantId } = ctx;
    await assertCallLeadAccess(callLeadId);

    const result = await callService.initiate({
      callLeadId,
      userId: user.id,
      tenantId,
      user,
      provider,
    });

    return NextResponse.json({
      callAttemptId: result.callAttemptId,
      callLeadId: result.callLeadId,
      provider: result.provider,
      dialUri: result.dialUri,
      phoneNumber: result.phoneNumber,
    });
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof CallServiceError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "PROVIDER_UNAVAILABLE"
            ? 501
            : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: "発信の開始に失敗しました" }, { status: 500 });
  }
}
