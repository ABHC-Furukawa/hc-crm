import { TenantPlan } from "@prisma/client";
import { z } from "zod";

export const tenantSlugSchema = z
  .string()
  .min(2, "slug は2文字以上で入力してください")
  .max(50, "slug は50文字以内で入力してください")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "slug は半角英小文字・数字・ハイフンのみ使用できます"
  );

export const updateTenantSchema = z.object({
  name: z.string().min(1, "組織名を入力してください").max(100),
});

export const createTenantSchema = z.object({
  name: z.string().min(1, "組織名を入力してください").max(100),
  slug: tenantSlugSchema,
  adminEmail: z.string().email("有効なメールアドレスを入力してください"),
  adminLastName: z.string().min(1, "姓を入力してください").max(50),
  adminFirstName: z.string().max(50).optional(),
});

export const updateTenantPlanSchema = z.object({
  tenantId: z.string().uuid("テナント ID が不正です"),
  plan: z.nativeEnum(TenantPlan, { message: "プランを選択してください" }),
});
