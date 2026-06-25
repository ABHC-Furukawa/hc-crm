import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

/** Edge-safe: reads Supabase auth metadata only (no Prisma). */
export function hasPendingInviteFromAuth(
  authUser: SupabaseAuthUser
): boolean {
  return authUser.user_metadata?.pendingInvite === true;
}
