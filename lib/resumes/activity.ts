import type { Prisma } from "@prisma/client";
import { ActivityAction } from "@prisma/client";

type LogResumeActivityParams = {
  candidateId: string | null;
  userId: string;
  action: ActivityAction;
  resumeId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logResumeActivity(
  tx: Prisma.TransactionClient,
  params: LogResumeActivityParams
): Promise<void> {
  if (!params.candidateId) return;

  await tx.activity.create({
    data: {
      candidateId: params.candidateId,
      userId: params.userId,
      action: params.action,
      entityType: "RESUME",
      entityId: params.resumeId,
      metadata: params.metadata,
    },
  });
}
