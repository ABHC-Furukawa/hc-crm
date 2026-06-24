import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getDefaultTenantId } from "@/lib/tenant/context";
import type { User } from "@prisma/client";

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { authId: authUser.id },
  });

  if (dbUser) return dbUser;

  const email = authUser.email;
  if (!email) return null;

  const existingByEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  if (existingByEmail) return null;

  const metaName = authUser.user_metadata?.name as string | undefined;
  const metaLastName = authUser.user_metadata?.lastName as string | undefined;
  const metaFirstName = authUser.user_metadata?.firstName as string | undefined;
  const fallbackName = metaName ?? email.split("@")[0];
  const lastName =
    metaLastName?.trim() ||
    (metaName?.trim().split(/\s+/)[0] ?? fallbackName);
  const firstName = metaFirstName?.trim() || null;
  const name = metaName?.trim() || [lastName, firstName].filter(Boolean).join(" ");
  const tenantId = await getDefaultTenantId();

  return prisma.user.upsert({
    where: { authId: authUser.id },
    update: {
      email,
      name,
    },
    create: {
      authId: authUser.id,
      email,
      name,
      lastName,
      firstName,
      tenantId,
    },
  });
}

export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
