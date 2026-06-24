import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCanCreate } from "@/lib/tenant/enforce-limits";
import { logUserInvited } from "@/lib/tenant/audit";
import { formatUserFullName } from "@/lib/users/display";
import { getSiteUrl } from "@/lib/utils/site-url";

export type InviteUserInput = {
  email: string;
  lastName: string;
  firstName?: string | null;
  tenantId: string;
  role: UserRole;
  managerId?: string | null;
  actorUserId?: string;
};

export type InviteUserResult = {
  userId: string;
  authId: string;
};

export function getInviteRedirectUrl(): string {
  return `${getSiteUrl()}/auth/callback?next=/accept-invite`;
}

export async function inviteUserToTenant(
  input: InviteUserInput
): Promise<InviteUserResult> {
  const email = input.email.trim().toLowerCase();
  const lastName = input.lastName.trim();
  const firstName = input.firstName?.trim() || null;
  const name = formatUserFullName(lastName, firstName);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, pendingInvite: true },
  });
  if (existing) {
    throw new InviteUserError(
      "EMAIL_EXISTS",
      "このメールアドレスは既に登録されています"
    );
  }

  await assertCanCreate(input.tenantId, "users", {
    actorUserId: input.actorUserId,
  });

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    throw new InviteUserError(
      "CONFIG",
      "アカウント作成の設定が不足しています（SUPABASE_SERVICE_ROLE_KEY を確認してください）"
    );
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: getInviteRedirectUrl(),
      data: {
        name,
        lastName,
        firstName,
        pendingInvite: true,
        tenantId: input.tenantId,
      },
    });

  if (authError || !authData.user) {
    throw new InviteUserError(
      "AUTH",
      authError?.message ?? "招待メールの送信に失敗しました"
    );
  }

  try {
    const user = await prisma.user.create({
      data: {
        authId: authData.user.id,
        email,
        name,
        lastName,
        firstName,
        tenantId: input.tenantId,
        role: input.role,
        managerId: input.role === UserRole.ADVISOR ? input.managerId ?? null : null,
        pendingInvite: true,
        isActive: true,
      },
    });

    if (input.actorUserId) {
      await logUserInvited({
        tenantId: input.tenantId,
        email,
        role: input.role,
        userId: user.id,
        actorUserId: input.actorUserId,
      });
    }

    return { userId: user.id, authId: authData.user.id };
  } catch (error) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw error;
  }
}

export async function resendUserInvite(userId: string, tenantId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId, pendingInvite: true },
    select: { email: true, name: true, lastName: true, firstName: true },
  });

  if (!user) {
    throw new InviteUserError("NOT_FOUND", "招待中のユーザーが見つかりません");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    throw new InviteUserError(
      "CONFIG",
      "アカウント作成の設定が不足しています（SUPABASE_SERVICE_ROLE_KEY を確認してください）"
    );
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(user.email, {
    redirectTo: getInviteRedirectUrl(),
    data: {
      name: user.name,
      lastName: user.lastName,
      firstName: user.firstName,
      pendingInvite: true,
    },
  });

  if (error) {
    throw new InviteUserError("AUTH", error.message ?? "招待メールの再送に失敗しました");
  }
}

export class InviteUserError extends Error {
  constructor(
    public readonly code: "EMAIL_EXISTS" | "CONFIG" | "AUTH" | "NOT_FOUND",
    message: string
  ) {
    super(message);
    this.name = "InviteUserError";
  }
}
