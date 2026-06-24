"use server";

import { revalidatePath } from "next/cache";
import {
  ActivityAction,
  CallStatus,
  CommunicationChannel,
  PbxProvider,
  type Prisma,
} from "@prisma/client";
import { assertCandidateAccess, candidateAccessFilter } from "@/lib/auth/access";
import type { CommunicationFilters } from "@/lib/communications/filters";
import { communicationListInclude } from "@/lib/communications/queries";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth/session";
import { requireTenantContext } from "@/lib/tenant/context";
import { getActiveUsersForAssignment } from "@/lib/users/queries";
import { communicationLogSchema } from "@/lib/validators/communication";

export type CommunicationActionState = { error?: string };

function buildCandidateWhere(
  user: Awaited<ReturnType<typeof requireSessionUser>>,
  tenantId: string,
  filters: CommunicationFilters
): Prisma.CandidateWhereInput {
  const base = candidateAccessFilter(user, tenantId);

  if (filters.candidateId) {
    return { ...base, id: filters.candidateId };
  }

  if (filters.advisorId) {
    return {
      ...base,
      assignments: {
        some: { userId: filters.advisorId, unassignedAt: null },
      },
    };
  }

  return base;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getCommunicationsForUser(filters: CommunicationFilters = {}) {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();

  const dateFrom = filters.from ? new Date(filters.from) : undefined;
  const dateTo = filters.to ? endOfDay(new Date(filters.to)) : undefined;

  return prisma.communication.findMany({
    where: {
      candidate: buildCandidateWhere(user, tenantId, filters),
      ...(filters.channel ? { channel: filters.channel } : {}),
      ...(dateFrom || dateTo
        ? {
            occurredAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
    include: communicationListInclude,
    orderBy: { occurredAt: "desc" },
    take: 200,
  });
}

export async function getCommunicationFilterOptions() {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();

  const [candidates, advisors] = await Promise.all([
    prisma.candidate.findMany({
      where: candidateAccessFilter(user, tenantId),
      select: { id: true, lastName: true, firstName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    getActiveUsersForAssignment(tenantId),
  ]);

  return { candidates, advisors };
}



async function upsertCallForCommunication(
  tx: Prisma.TransactionClient,

  communicationId: string,

  channel: CommunicationChannel,

  direction: string,

  candidatePhone: string,

  userId: string,

  occurredAt: Date,

  callStatus?: string,

  durationSeconds?: number

) {

  if (channel !== CommunicationChannel.CALL) return;



  const status = (callStatus as CallStatus | undefined) ?? CallStatus.COMPLETED;

  const isOutbound = direction === "OUTBOUND";

  const callData = {

    provider: PbxProvider.UNKNOWN,

    fromNumber: isOutbound ? "CA" : candidatePhone,

    toNumber: isOutbound ? candidatePhone : "CA",

    callStatus: status,

    durationSeconds: durationSeconds ?? null,

    answeredByUserId: status === CallStatus.COMPLETED ? userId : null,

    endedAt: occurredAt,

  };



  const existing = await tx.call.findUnique({ where: { communicationId } });

  if (existing) {

    await tx.call.update({ where: { communicationId }, data: callData });

  } else {

    await tx.call.create({ data: { communicationId, ...callData } });

  }

}



export async function createCommunicationFromGlobalAction(
  _prev: CommunicationActionState,
  formData: FormData
): Promise<CommunicationActionState> {
  const candidateId = formData.get("candidateId");
  if (typeof candidateId !== "string" || candidateId.length === 0) {
    return { error: CANDIDATE_DISPLAY.selectRequired };
  }
  return createCommunicationLogAction(candidateId, _prev, formData);
}

export async function createCommunicationLogAction(

  candidateId: string,

  _prev: CommunicationActionState,

  formData: FormData

): Promise<CommunicationActionState> {

  const { user, candidate } = await assertCandidateAccess(candidateId);



  const parsed = communicationLogSchema.safeParse({

    channel: formData.get("channel"),

    direction: formData.get("direction"),

    subject: formData.get("subject") || undefined,

    body: formData.get("body") || undefined,

    status: formData.get("status") ?? "SENT",

    occurredAt: formData.get("occurredAt") || undefined,

    callStatus: formData.get("callStatus") || undefined,

    durationSeconds: formData.get("durationSeconds") || undefined,

  });



  if (!parsed.success) {

    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };

  }



  const data = parsed.data;

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();



  await prisma.$transaction(async (tx) => {

    const communication = await tx.communication.create({

      data: {

        candidateId,

        userId: user.id,

        channel: data.channel,

        direction: data.direction,

        subject: data.subject,

        body: data.body,

        status: data.status,

        occurredAt,

      },

    });



    await upsertCallForCommunication(

      tx,

      communication.id,

      data.channel,

      data.direction,

      candidate.phone,

      user.id,

      occurredAt,

      data.callStatus,

      data.durationSeconds

    );



    await tx.activity.create({

      data: {

        candidateId,

        userId: user.id,

        action:

          data.channel === CommunicationChannel.CALL

            ? ActivityAction.CALL_COMPLETED

            : ActivityAction.COMMUNICATION_LOGGED,

        entityType:

          data.channel === CommunicationChannel.CALL ? "CALL" : "COMMUNICATION",

        entityId: communication.id,

        metadata: {

          channel: data.channel,

          direction: data.direction,

        },

      },

    });

  });



  revalidatePath(`/candidates/${candidateId}`);

  revalidatePath("/communications");

  return {};

}



export async function updateCommunicationLogAction(

  communicationId: string,

  candidateId: string,

  _prev: CommunicationActionState,

  formData: FormData

): Promise<CommunicationActionState> {

  const { user, candidate } = await assertCandidateAccess(candidateId);



  const parsed = communicationLogSchema.safeParse({

    channel: formData.get("channel"),

    direction: formData.get("direction"),

    subject: formData.get("subject") || undefined,

    body: formData.get("body") || undefined,

    status: formData.get("status") ?? "SENT",

    occurredAt: formData.get("occurredAt") || undefined,

    callStatus: formData.get("callStatus") || undefined,

    durationSeconds: formData.get("durationSeconds") || undefined,

  });



  if (!parsed.success) {

    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };

  }



  const existing = await prisma.communication.findFirst({

    where: { id: communicationId, candidateId },

    include: { call: true },

  });

  if (!existing) {

    return { error: "連絡履歴が見つかりません" };

  }



  const data = parsed.data;

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : existing.occurredAt;



  await prisma.$transaction(async (tx) => {

    await tx.communication.update({

      where: { id: communicationId },

      data: {

        channel: data.channel,

        direction: data.direction,

        subject: data.subject || null,

        body: data.body || null,

        status: data.status,

        occurredAt,

      },

    });



    if (data.channel === CommunicationChannel.CALL) {

      await upsertCallForCommunication(

        tx,

        communicationId,

        data.channel,

        data.direction,

        candidate.phone,

        user.id,

        occurredAt,

        data.callStatus ?? existing.call?.callStatus,

        data.durationSeconds ?? existing.call?.durationSeconds ?? undefined

      );

    } else if (existing.call) {

      await tx.call.delete({ where: { communicationId } });

    }



    await tx.activity.create({

      data: {

        candidateId,

        userId: user.id,

        action: ActivityAction.UPDATED,

        entityType:

          data.channel === CommunicationChannel.CALL ? "CALL" : "COMMUNICATION",

        entityId: communicationId,

        metadata: { channel: data.channel },

      },

    });

  });



  revalidatePath(`/candidates/${candidateId}`);

  revalidatePath("/communications");

  return {};

}



export async function deleteCommunicationAction(

  communicationId: string,

  candidateId: string

) {

  const { user } = await assertCandidateAccess(candidateId);



  const existing = await prisma.communication.findFirst({

    where: { id: communicationId, candidateId },

  });

  if (!existing) return;



  await prisma.$transaction(async (tx) => {

    await tx.communication.delete({ where: { id: communicationId } });



    await tx.activity.create({

      data: {

        candidateId,

        userId: user.id,

        action: ActivityAction.DELETED,

        entityType:

          existing.channel === CommunicationChannel.CALL ? "CALL" : "COMMUNICATION",

        entityId: communicationId,

        metadata: { channel: existing.channel },

      },

    });

  });



  revalidatePath(`/candidates/${candidateId}`);

  revalidatePath("/communications");

}


