import { CommunicationChannel } from "@prisma/client";

export type CommunicationFilters = {
  channel?: CommunicationChannel;
  from?: string;
  to?: string;
  candidateId?: string;
  advisorId?: string;
};

const VALID_CHANNELS = new Set<string>(Object.values(CommunicationChannel));

export function parseCommunicationFilters(
  params: Record<string, string | string[] | undefined>
): CommunicationFilters {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  };

  const channel = get("channel");
  return {
    channel:
      channel && VALID_CHANNELS.has(channel)
        ? (channel as CommunicationChannel)
        : undefined,
    from: get("from"),
    to: get("to"),
    candidateId: get("candidateId"),
    advisorId: get("advisorId"),
  };
}

export function hasActiveCommunicationFilters(filters: CommunicationFilters): boolean {
  return Boolean(
    filters.channel ||
      filters.from ||
      filters.to ||
      filters.candidateId ||
      filters.advisorId
  );
}
