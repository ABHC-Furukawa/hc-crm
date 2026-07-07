import {
  CallAttemptStatus,
  CallDialProvider,
  CallLeadActivityAction,
  CallLeadEntityType,
  CallLeadStatus,
} from "@prisma/client";
import type { User } from "@prisma/client";
import { callLeadByIdWhere } from "@/lib/call-leads/queries";
import {
  syncCallLeadCallCount,
  touchCallLeadLastCalledAt,
} from "@/lib/call-leads/sync-call-count";
import { telCallProvider } from "@/lib/calls/providers/tel-provider";
import type {
  CallProvider,
  InitiateCallInput,
  InitiateCallResult,
} from "@/lib/calls/types";
import { CallServiceError } from "@/lib/calls/types";
import { prisma } from "@/lib/prisma";

const NON_DIALABLE_STATUSES: CallLeadStatus[] = [
  CallLeadStatus.DUPLICATE,
  CallLeadStatus.OUT_OF_SCOPE,
  CallLeadStatus.REFERRAL_NOT_AVAILABLE,
  CallLeadStatus.CONVERTED,
];

const providerRegistry: Partial<Record<CallDialProvider, CallProvider>> = {
  [CallDialProvider.TEL]: telCallProvider,
};

function resolveProvider(type: CallDialProvider): CallProvider {
  const provider = providerRegistry[type];
  if (!provider) {
    throw new CallServiceError(
      `${type} Provider は未実装です`,
      "PROVIDER_UNAVAILABLE"
    );
  }
  return provider;
}

export type InitiateCallWithUserInput = InitiateCallInput & {
  user: User;
};

export class CallService {
  /** 架電開始 — CallAttempt 作成 + Provider 経由で dialUri 返却 */
  async initiate(input: InitiateCallWithUserInput): Promise<InitiateCallResult> {
    const providerType = input.provider ?? CallDialProvider.TEL;
    const dialProvider = resolveProvider(providerType);

    const callLead = await prisma.callLead.findFirst({
      where: callLeadByIdWhere(input.user, input.tenantId, input.callLeadId),
      select: {
        id: true,
        phone: true,
        status: true,
      },
    });

    if (!callLead) {
      throw new CallServiceError("架電リードが見つかりません", "NOT_FOUND");
    }

    if (!callLead.phone?.trim()) {
      throw new CallServiceError("電話番号が登録されていません", "NO_PHONE");
    }

    if (NON_DIALABLE_STATUSES.includes(callLead.status)) {
      throw new CallServiceError("この架電リードには発信できません", "NOT_DIALABLE");
    }

    const calledAt = new Date();
    const phoneNumber = callLead.phone.trim();

    const callAttempt = await prisma.$transaction(async (tx) => {
      const attempt = await tx.callAttempt.create({
        data: {
          callLeadId: callLead.id,
          calledById: input.userId,
          calledAt,
          provider: providerType,
          callStatus: CallAttemptStatus.INITIATED,
          startedAt: calledAt,
        },
      });

      await touchCallLeadLastCalledAt(callLead.id, calledAt, tx);
      await syncCallLeadCallCount(callLead.id, tx);

      await tx.callLeadActivity.create({
        data: {
          tenantId: input.tenantId,
          callLeadId: callLead.id,
          userId: input.userId,
          action: CallLeadActivityAction.CALL_INITIATED,
          entityType: CallLeadEntityType.CALL_ATTEMPT,
          entityId: attempt.id,
          metadata: {
            provider: providerType,
            phoneNumber,
          },
        },
      });

      return attempt;
    });

    const providerResponse = await dialProvider.initiate({
      phoneNumber,
      callLeadId: callLead.id,
      callAttemptId: callAttempt.id,
    });

    if (providerResponse.externalCallId) {
      await prisma.callAttempt.update({
        where: { id: callAttempt.id },
        data: { externalCallId: providerResponse.externalCallId },
      });
    }

    return {
      callAttemptId: callAttempt.id,
      callLeadId: callLead.id,
      provider: providerResponse.provider,
      dialUri: providerResponse.dialUri,
      phoneNumber,
    };
  }
}

export const callService = new CallService();
