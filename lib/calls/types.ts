import type { CallDialProvider } from "@prisma/client";

export type InitiateCallParams = {
  phoneNumber: string;
  callLeadId: string;
  callAttemptId: string;
};

export type InitiateCallResponse = {
  provider: CallDialProvider;
  dialUri?: string;
  externalCallId?: string;
};

/** 発信 Provider Interface（TEL / PBX 拡張用） */
export interface CallProvider {
  readonly providerType: CallDialProvider;
  initiate(params: InitiateCallParams): Promise<InitiateCallResponse>;
}

export type InitiateCallInput = {
  callLeadId: string;
  userId: string;
  tenantId: string;
  provider?: CallDialProvider;
};

export type InitiateCallResult = {
  callAttemptId: string;
  callLeadId: string;
  provider: CallDialProvider;
  dialUri?: string;
  phoneNumber: string;
};

export class CallServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_FOUND"
      | "NO_PHONE"
      | "NOT_DIALABLE"
      | "PROVIDER_UNAVAILABLE"
  ) {
    super(message);
    this.name = "CallServiceError";
  }
}
