import { z } from "zod";
import { NoteType } from "@prisma/client";

export const noteSchema = z.object({
  content: z.string().min(1, "メモ内容を入力してください"),
  type: z.nativeEnum(NoteType).default(NoteType.GENERAL),
});

export type NoteFormValues = z.infer<typeof noteSchema>;
