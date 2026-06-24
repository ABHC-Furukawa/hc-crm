import { z } from "zod";

export const callLeadNoteSchema = z.object({
  content: z.string().trim().min(1, "内容を入力してください"),
});

export type CallLeadNoteFormValues = z.infer<typeof callLeadNoteSchema>;
