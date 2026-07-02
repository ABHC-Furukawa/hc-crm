import { createHash } from "node:crypto";
import type { CallLeadImportRow } from "@/lib/import/types";

export type SourceHashInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
  applicationArea?: string | null;
  appliedAt?: Date | null;
};

export function buildSourceHash(input: SourceHashInput): string {
  const parts = [
    input.name.trim(),
    input.email?.trim().toLowerCase() ?? "",
    input.phone?.trim() ?? "",
    input.age != null ? String(input.age) : "",
    input.applicationArea?.trim() ?? "",
    input.appliedAt?.toISOString() ?? "",
  ];

  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export function buildSourceHashFromRow(row: CallLeadImportRow): string {
  return buildSourceHash({
    name: row.name,
    email: row.email,
    phone: row.phone,
    age: row.age,
    applicationArea: row.applicationArea,
    appliedAt: row.appliedAt,
  });
}
