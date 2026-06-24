/**
 * Phase 4c — メール招待フローの検証
 * node scripts/verify-user-invite.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

async function main() {
  const checks = [
    ["lib/users/invite.ts", /inviteUserByEmail/],
    ["lib/actions/users.ts", /inviteUserAction/],
    ["lib/actions/users.ts", /resendInviteAction/],
    ["lib/actions/auth.ts", /acceptInviteAction/],
    ["app/(auth)/accept-invite/page.tsx", /AcceptInviteForm/],
    ["components/users/invite-user-form.tsx", /inviteUserAction/],
    ["lib/supabase/middleware.ts", /accept-invite/],
    ["prisma/schema.prisma", /pendingInvite/],
  ];

  for (const [file, pattern] of checks) {
    const content = read(file);
    if (!pattern.test(content)) {
      console.error(`FAIL: ${file} missing expected pattern ${pattern}`);
      process.exitCode = 1;
      return;
    }
  }

  const columns = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'pending_invite'
  `;

  if (!Array.isArray(columns) || columns.length === 0) {
    console.error("FAIL: users.pending_invite column not found — run prisma migrate deploy");
    process.exitCode = 1;
    return;
  }

  console.log("OK: Phase 4c invite flow files and schema present");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
