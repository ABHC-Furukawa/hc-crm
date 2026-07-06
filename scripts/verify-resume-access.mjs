/**
 * Resume feature — access control verification
 *
 *   npm run verify:resume-access
 */
import { PrismaClient, UserRole } from "@prisma/client";
import { canViewTenantCandidates } from "../lib/auth/rbac.ts";
import { resumeAccessWhere } from "../lib/resumes/queries.ts";

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function pickUser(role) {
  const user = await prisma.user.findFirst({
    where: { role, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  assert(user, `active ${role} user not found`);
  return user;
}

async function main() {
  const tenant = await prisma.tenant.findFirst({
    orderBy: { slug: "asc" },
    select: { id: true, name: true },
  });
  assert(tenant, "tenant not found");
  console.log("Tenant:", tenant.name);

  const admin = await pickUser(UserRole.ADMIN);
  const advisor = await pickUser(UserRole.ADVISOR);

  const adminResumes = await prisma.resume.findMany({
    where: resumeAccessWhere(admin, tenant.id),
    select: { id: true, candidateId: true, createdById: true },
  });
  const advisorResumes = await prisma.resume.findMany({
    where: resumeAccessWhere(advisor, tenant.id),
    select: { id: true, candidateId: true, createdById: true },
  });

  console.log(`ADMIN visible resumes: ${adminResumes.length}`);
  console.log(`ADVISOR visible resumes: ${advisorResumes.length}`);

  assert(
    advisorResumes.length <= adminResumes.length,
    "advisor should not see more resumes than admin"
  );

  const standalone = await prisma.resume.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
      candidateId: { equals: null },
    },
    select: { id: true, createdById: true },
  });

  for (const row of standalone) {
    const advisorCanSee = advisorResumes.some((resume) => resume.id === row.id);
    const adminCanSee = adminResumes.some((resume) => resume.id === row.id);

    if (canViewTenantCandidates(advisor.role)) {
      assert(advisorCanSee, `advisor should see standalone resume ${row.id}`);
    } else {
      const expected = row.createdById === advisor.id;
      assert(
        advisorCanSee === expected,
        `advisor standalone visibility mismatch for ${row.id}`
      );
    }

    assert(adminCanSee, `admin should see standalone resume ${row.id}`);
  }

  const linked = await prisma.resume.findMany({
    where: {
      tenantId: tenant.id,
      deletedAt: null,
      candidateId: { not: null },
    },
    select: { id: true, candidateId: true },
    take: 5,
  });

  for (const row of linked) {
    if (!row.candidateId) continue;
    const advisorCandidate = await prisma.candidate.findFirst({
      where: {
        id: row.candidateId,
        tenantId: tenant.id,
        deletedAt: null,
        assignments: {
          some: { userId: advisor.id, unassignedAt: null },
        },
      },
      select: { id: true },
    });

    const advisorCanSee = advisorResumes.some((resume) => resume.id === row.id);
    if (advisorCandidate) {
      assert(
        advisorCanSee,
        `advisor should see linked resume ${row.id} for assigned candidate`
      );
    }
  }

  console.log("PASS: resume access filters look consistent");
}

main()
  .catch((error) => {
    console.error("FAIL:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
