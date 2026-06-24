import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** CallAttempt 件数を CallLead.callCount に反映 */
export async function syncCallLeadCallCount(
  callLeadId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<number> {
  const count = await client.callAttempt.count({ where: { callLeadId } });
  await client.callLead.update({
    where: { id: callLeadId },
    data: { callCount: count },
  });
  return count;
}

/** 架電開始時に lastCalledAt を更新 */
export async function touchCallLeadLastCalledAt(
  callLeadId: string,
  calledAt: Date,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<void> {
  await client.callLead.update({
    where: { id: callLeadId },
    data: { lastCalledAt: calledAt },
  });
}
