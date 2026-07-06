import type { Prisma } from "@prisma/client";
import { AccessDeniedError, assertActiveUser } from "@/lib/auth/access";
import { requireSessionUser } from "@/lib/auth/session";
import { requireTenantContext } from "@/lib/tenant/context";
import { prisma } from "@/lib/prisma";
import { resumeByIdWhere } from "@/lib/resumes/queries";

const defaultResumeSelect = {
  id: true,
  candidateId: true,
  tenantId: true,
  documentType: true,
  templateType: true,
  status: true,
  fullName: true,
} satisfies Prisma.ResumeSelect;

export type AssertedResume = Prisma.ResumeGetPayload<{
  select: typeof defaultResumeSelect;
}>;

export async function assertResumeAccess(
  resumeId: string
): Promise<{
  user: Awaited<ReturnType<typeof requireSessionUser>>;
  resume: AssertedResume;
}> {
  const user = await requireSessionUser();
  assertActiveUser(user);
  const { tenantId } = await requireTenantContext();

  const resume = await prisma.resume.findFirst({
    where: resumeByIdWhere(user, resumeId, tenantId),
    select: defaultResumeSelect,
  });

  if (!resume) {
    throw new AccessDeniedError("履歴書が見つかりません");
  }

  return { user, resume };
}
