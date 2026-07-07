"use server";

import { revalidatePath } from "next/cache";
import { IMPROVEMENT_REQUEST_PRIORITY_LABELS } from "@/lib/constants/improvement-request";
import { notifyImprovementRequestToSlack } from "@/lib/notifications/slack";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant/context";
import { getTenantSummary } from "@/lib/tenant/queries";
import { improvementRequestSchema } from "@/lib/validators/improvement-request";

export type ImprovementRequestActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export async function submitImprovementRequestAction(
  _prev: ImprovementRequestActionState,
  formData: FormData
): Promise<ImprovementRequestActionState> {
  const { user, tenantId } = await requireTenantContext();

  const parsed = improvementRequestSchema.safeParse({
    name: formData.get("name"),
    priority: formData.get("priority"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const tenant = await getTenantSummary(tenantId);
  const createdAt = new Date();

  const request = await prisma.improvementRequest.create({
    data: {
      tenantId,
      submittedById: user.id,
      name: parsed.data.name,
      priority: parsed.data.priority,
      description: parsed.data.description,
    },
  });

  try {
    await notifyImprovementRequestToSlack({
      name: request.name,
      priorityLabel: IMPROVEMENT_REQUEST_PRIORITY_LABELS[request.priority],
      description: request.description,
      submitterName: user.name,
      submitterEmail: user.email,
      tenantName: tenant?.name ?? "不明",
      createdAt,
    });
  } catch (error) {
    console.error("Improvement request Slack notification failed:", error);
  }

  revalidatePath("/feedback");
  revalidatePath("/settings/feedback");

  return { success: true };
}
