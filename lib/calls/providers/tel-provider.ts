import { CallDialProvider } from "@prisma/client";
import { formatPhoneForTelUri } from "@/lib/call-leads/normalize";
import type { CallProvider, InitiateCallParams, InitiateCallResponse } from "@/lib/calls/types";

/** 端末の電話アプリを起動する TEL Provider */
export class TelCallProvider implements CallProvider {
  readonly providerType = CallDialProvider.TEL;

  async initiate(params: InitiateCallParams): Promise<InitiateCallResponse> {
    const dialUri = `tel:${formatPhoneForTelUri(params.phoneNumber)}`;
    return {
      provider: CallDialProvider.TEL,
      dialUri,
    };
  }
}

export const telCallProvider = new TelCallProvider();
