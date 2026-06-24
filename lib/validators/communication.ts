import { z } from "zod";
import {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
} from "@prisma/client";

export const communicationLogSchema = z.object({
  channel: z.nativeEnum(CommunicationChannel),
  direction: z.nativeEnum(CommunicationDirection),
  subject: z.string().optional(),
  body: z.string().optional(),
  status: z.nativeEnum(CommunicationStatus).default(CommunicationStatus.SENT),
  occurredAt: z.string().optional(),
  // Call extension (optional — PBX連携時は webhook が埋める)
  callStatus: z.string().optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
});

export type CommunicationLogFormValues = z.infer<typeof communicationLogSchema>;

export const COMMUNICATION_CHANNELS_MANUAL: CommunicationChannel[] = [
  "CALL",
  "EMAIL",
  "SMS",
  "LINE",
  "MEETING",
  "OTHER",
];
