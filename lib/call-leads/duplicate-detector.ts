import { CallLeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  candidateFullName,
  nameAgeKey,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from "@/lib/call-leads/normalize";

export type DuplicateMatchType = "email" | "phone" | "name_age";
export type DuplicateEntityType = "candidate" | "call_lead";

export type DuplicateMatch = {
  matchType: DuplicateMatchType;
  entityType: DuplicateEntityType;
  entityId: string;
};

export type DuplicateCheckInput = {
  email?: string | null;
  phone?: string | null;
  name: string;
  age?: number | null;
};

export type BatchDuplicateTracker = {
  emails: Set<string>;
  phones: Set<string>;
  nameAges: Set<string>;
};

export function createBatchDuplicateTracker(): BatchDuplicateTracker {
  return {
    emails: new Set(),
    phones: new Set(),
    nameAges: new Set(),
  };
}

/** 同一取込バッチ内の重複を検出 */
export function findBatchDuplicate(
  input: DuplicateCheckInput,
  tracker: BatchDuplicateTracker
): DuplicateMatch | null {
  const email = normalizeEmail(input.email);
  if (email && tracker.emails.has(email)) {
    return { matchType: "email", entityType: "call_lead", entityId: "batch" };
  }

  const phone = normalizePhone(input.phone);
  if (phone && tracker.phones.has(phone)) {
    return { matchType: "phone", entityType: "call_lead", entityId: "batch" };
  }

  const normalizedName = normalizeName(input.name);
  if (normalizedName && input.age != null) {
    const key = nameAgeKey(input.name, input.age);
    if (tracker.nameAges.has(key)) {
      return { matchType: "name_age", entityType: "call_lead", entityId: "batch" };
    }
  }

  return null;
}

/** 取込行をバッチ tracker に登録 */
export function registerBatchRow(
  input: DuplicateCheckInput,
  tracker: BatchDuplicateTracker
): void {
  const email = normalizeEmail(input.email);
  if (email) tracker.emails.add(email);

  const phone = normalizePhone(input.phone);
  if (phone) tracker.phones.add(phone);

  if (normalizeName(input.name) && input.age != null) {
    tracker.nameAges.add(nameAgeKey(input.name, input.age));
  }
}

/** DUPLICATE 以外の CallLead のみ「1件目」としてカウント（2件目以降を DUPLICATE にする） */
const canonicalCallLeadFilter = {
  status: { not: CallLeadStatus.DUPLICATE },
} satisfies { status: { not: CallLeadStatus } };

/**
 * 同一 tenant 内 CallLead + Candidate 横断重複判定。
 * CallLead は DUPLICATE 以外のみ「1件目」として扱う（2件目以降 → DUPLICATE）。
 * 優先順位: email → phone → name+age
 */
export async function findDuplicateMatch(
  tenantId: string,
  input: DuplicateCheckInput,
  excludeCallLeadId?: string
): Promise<DuplicateMatch | null> {
  const email = normalizeEmail(input.email);
  if (email) {
    const callLead = await prisma.callLead.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        email: { equals: email, mode: "insensitive" },
        ...canonicalCallLeadFilter,
        ...(excludeCallLeadId ? { id: { not: excludeCallLeadId } } : {}),
      },
      select: { id: true },
    });
    if (callLead) {
      return { matchType: "email", entityType: "call_lead", entityId: callLead.id };
    }

    const candidate = await prisma.candidate.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (candidate) {
      return { matchType: "email", entityType: "candidate", entityId: candidate.id };
    }
  }

  const phone = normalizePhone(input.phone);
  if (phone) {
    const callLeads = await prisma.callLead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        phone: { not: null },
        ...canonicalCallLeadFilter,
        ...(excludeCallLeadId ? { id: { not: excludeCallLeadId } } : {}),
      },
      select: { id: true, phone: true },
    });
    for (const row of callLeads) {
      if (normalizePhone(row.phone) === phone) {
        return { matchType: "phone", entityType: "call_lead", entityId: row.id };
      }
    }

    const candidates = await prisma.candidate.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, phone: true, phoneSecondary: true },
    });
    for (const row of candidates) {
      if (
        normalizePhone(row.phone) === phone ||
        normalizePhone(row.phoneSecondary) === phone
      ) {
        return { matchType: "phone", entityType: "candidate", entityId: row.id };
      }
    }
  }

  const normalizedName = normalizeName(input.name);
  if (normalizedName && input.age != null) {
    const callLeads = await prisma.callLead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        age: input.age,
        ...canonicalCallLeadFilter,
        ...(excludeCallLeadId ? { id: { not: excludeCallLeadId } } : {}),
      },
      select: { id: true, name: true },
    });
    for (const row of callLeads) {
      if (normalizeName(row.name) === normalizedName) {
        return { matchType: "name_age", entityType: "call_lead", entityId: row.id };
      }
    }

    const candidates = await prisma.candidate.findMany({
      where: { tenantId, deletedAt: null, age: input.age },
      select: { id: true, lastName: true, firstName: true },
    });
    for (const row of candidates) {
      if (candidateFullName(row.lastName, row.firstName) === normalizedName) {
        return { matchType: "name_age", entityType: "candidate", entityId: row.id };
      }
    }
  }

  return null;
}

/** DB（1件目のみ）+ 同一バッチ内の 2 件目以降を重複と判定 */
export async function isDuplicateLead(
  tenantId: string,
  input: DuplicateCheckInput,
  tracker: BatchDuplicateTracker
): Promise<boolean> {
  if (findBatchDuplicate(input, tracker)) return true;
  const match = await findDuplicateMatch(tenantId, input);
  return match != null;
}
