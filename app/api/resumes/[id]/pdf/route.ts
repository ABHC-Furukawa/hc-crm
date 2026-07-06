import { NextResponse } from "next/server";
import { ActivityAction } from "@prisma/client";
import { AccessDeniedError } from "@/lib/auth/access";
import { assertResumeAccess } from "@/lib/resumes/access";
import { logResumeActivity } from "@/lib/resumes/activity";
import { generateResumePdfBuffer } from "@/lib/resumes/pdf/generate-resume-pdf";
import { buildPdfFileName } from "@/lib/resumes/pdf/types";
import { getResumeById } from "@/lib/resumes/queries";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getTenantContext();
  if (!ctx) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { user } = await assertResumeAccess(id);
    const resume = await getResumeById(user, id, ctx.tenantId);

    if (!resume) {
      return NextResponse.json({ error: "履歴書が見つかりません" }, { status: 404 });
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    const pdfBuffer = await generateResumePdfBuffer(resume);
    const fileName = buildPdfFileName(resume.fullName);

    await prisma.$transaction(async (tx) => {
      await tx.resumeExportLog.create({
        data: {
          resumeId: resume.id,
          exportedById: user.id,
          fileName,
        },
      });

      await logResumeActivity(tx, {
        candidateId: resume.candidateId,
        userId: user.id,
        action: ActivityAction.RESUME_EXPORTED,
        resumeId: resume.id,
        metadata: { fileName, download },
      });
    });

    const disposition = download
      ? `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
      : "inline";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Resume PDF export failed:", error);
    return NextResponse.json(
      { error: "PDF の生成に失敗しました" },
      { status: 500 }
    );
  }
}
