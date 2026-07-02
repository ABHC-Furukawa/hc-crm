import type { CallLead } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  candidateFullName,
  nameAgeKey,
  normalizeEmail,
  normalizeName,
  normalizePhone,
} from "@/lib/call-leads/normalize";
import type { CallLeadImportRow } from "@/lib/import/types";

export type UpsertLookupInput = {
  sourceName?: string | null;
  sourceSheet?: string | null;
  sourceRowNumber?: number | null;
  sourceHash?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
};

/** Upsert 用: 既存 CallLead を優先順位どおりに検索 */
export async function findExistingCallLeadForUpsert(
  tenantId: string,
  input: UpsertLookupInput
): Promise<CallLead | null> {
  const {
    sourceName,
    sourceSheet,
    sourceRowNumber,
    sourceHash,
    name,
    email,
    phone,
    age,
  } = input;

  if (sourceName && sourceSheet && sourceRowNumber != null) {
    const bySource = await prisma.callLead.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        sourceName,
        sourceSheet,
        sourceRowNumber,
      },
    });
    if (bySource) return bySource;
  }

  if (sourceHash) {
    const byHash = await prisma.callLead.findFirst({
      where: { tenantId, deletedAt: null, sourceHash },
    });
    if (byHash) return byHash;
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone) {
    const phoneRows = await prisma.callLead.findMany({
      where: { tenantId, deletedAt: null, phone: { not: null } },
    });
    for (const row of phoneRows) {
      if (normalizePhone(row.phone) === normalizedPhone) return row;
    }
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    const byEmail = await prisma.callLead.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        email: { equals: normalizedEmail, mode: "insensitive" },
      },
    });
    if (byEmail) return byEmail;
  }

  const normalizedName = normalizeName(name);
  if (normalizedName && age != null) {
    const nameAgeRows = await prisma.callLead.findMany({
      where: { tenantId, deletedAt: null, age },
    });
    for (const row of nameAgeRows) {
      if (normalizeName(row.name) === normalizedName) return row;
    }
  }

  return null;
}

export function toUpsertLookup(
  row: CallLeadImportRow,
  meta: { sourceName?: string | null; sourceHash: string }
): UpsertLookupInput {
  return {
    sourceName: meta.sourceName,
    sourceSheet: row.sourceSheet,
    sourceRowNumber: row.sourceRowNumber,
    sourceHash: meta.sourceHash,
    name: row.name,
    email: row.email,
    phone: row.phone,
    age: row.age,
  };
}

export function nameAgeLookupKey(name: string, age: number | null | undefined): string | null {
  if (age == null) return null;
  return nameAgeKey(name, age);
}

export { candidateFullName, normalizeName, normalizePhone, normalizeEmail };
