import { prisma } from "@/lib/prisma";
import {
  candidateFullName,
  normalizeEmail,
  normalizePhone,
} from "@/lib/call-leads/normalize";

export type DuplicateCandidateMatch = {
  id: string;
  lastName: string;
  firstName: string;
  primaryAdvisorName: string | null;
};

type DuplicateCheckInput = {
  email?: string | null;
  phone: string;
  lastName: string;
  firstName: string;
  age?: number | null;
};

const candidateSelect = {
  id: true,
  lastName: true,
  firstName: true,
  email: true,
  phone: true,
  phoneSecondary: true,
  age: true,
  assignments: {
    where: { role: "PRIMARY" as const, unassignedAt: null },
    take: 1,
    include: { user: { select: { name: true } } },
  },
};

function toMatch(
  row: {
    id: string;
    lastName: string;
    firstName: string;
    assignments: { user: { name: string } }[];
  }
): DuplicateCandidateMatch {
  return {
    id: row.id,
    lastName: row.lastName,
    firstName: row.firstName,
    primaryAdvisorName: row.assignments[0]?.user.name ?? null,
  };
}

/** 同一 tenant 内の既存求職者との重複候補を検索（登録はブロックしない） */
export async function findDuplicateCandidates(
  tenantId: string,
  input: DuplicateCheckInput
): Promise<DuplicateCandidateMatch[]> {
  const matches = new Map<string, DuplicateCandidateMatch>();
  const add = (row: Parameters<typeof toMatch>[0]) => {
    matches.set(row.id, toMatch(row));
  };

  const email = normalizeEmail(input.email);
  if (email) {
    const rows = await prisma.candidate.findMany({
      where: {
        tenantId,
        deletedAt: null,
        email: { equals: email, mode: "insensitive" },
      },
      select: candidateSelect,
    });
    rows.forEach(add);
  }

  const phone = normalizePhone(input.phone);
  if (phone) {
    const rows = await prisma.candidate.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: candidateSelect,
    });
    for (const row of rows) {
      if (
        normalizePhone(row.phone) === phone ||
        normalizePhone(row.phoneSecondary) === phone
      ) {
        add(row);
      }
    }
  }

  if (input.age != null) {
    const normalizedInputName = candidateFullName(input.lastName, input.firstName);
    if (normalizedInputName) {
      const rows = await prisma.candidate.findMany({
        where: {
          tenantId,
          deletedAt: null,
          age: input.age,
        },
        select: candidateSelect,
      });
      for (const row of rows) {
        if (candidateFullName(row.lastName, row.firstName) === normalizedInputName) {
          add(row);
        }
      }
    }
  }

  return [...matches.values()];
}

export function formatDuplicateRegistrationNotice(
  matches: DuplicateCandidateMatch[]
): string {
  if (matches.length === 0) return "";
  const parts = matches.map((match) => {
    const name = `${match.lastName} ${match.firstName}`.trim();
    const advisor = match.primaryAdvisorName ?? "担当未設定";
    return `${name}（担当: ${advisor}）`;
  });
  return `${parts.join("、")}と登録が被っています`;
}
