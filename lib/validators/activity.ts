import { z } from "zod";
import { ActivityAction, ActivityEntityType } from "@prisma/client";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const ACTIVITY_PAGE_SIZE = 20;

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  action: z.preprocess(
    emptyToUndefined,
    z.nativeEnum(ActivityAction).optional()
  ),
  entityType: z.preprocess(
    emptyToUndefined,
    z.nativeEnum(ActivityEntityType).optional()
  ),
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;

export function parseActivityQuery(
  params: Record<string, string | undefined>
): ActivityQuery {
  return activityQuerySchema.parse({
    page: params.page ?? "1",
    action: params.action,
    entityType: params.entityType,
  });
}
