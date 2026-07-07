import { ImprovementRequestPriority } from "@prisma/client";
import { z } from "zod";

export const improvementRequestSchema = z.object({
  name: z.string().trim().min(1, "名前は必須です").max(120, "名前は120文字以内です"),
  priority: z.nativeEnum(ImprovementRequestPriority, {
    errorMap: () => ({ message: "優先度を選択してください" }),
  }),
  description: z
    .string()
    .trim()
    .min(1, "改善項目の記述は必須です")
    .max(5000, "改善項目の記述は5000文字以内です"),
});

export type ImprovementRequestInput = z.infer<typeof improvementRequestSchema>;
