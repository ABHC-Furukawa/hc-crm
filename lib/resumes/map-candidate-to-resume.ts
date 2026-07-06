import {
  ResumeDocumentType,
  ResumeTemplateType,
  type Candidate,
  type Prisma,
} from "@prisma/client";
import { fullName } from "@/lib/utils";
import type { CreateResumeOptions, ResumeLicenseEntry } from "@/lib/resumes/types";

type CandidateForResumeMapping = Pick<
  Candidate,
  | "lastName"
  | "firstName"
  | "furigana"
  | "birthDate"
  | "postalCode"
  | "addressLine"
  | "phone"
  | "email"
  | "qualifications"
  | "workDescription"
>;

export function mapQualificationsToLicenses(
  qualifications: string[]
): ResumeLicenseEntry[] {
  return qualifications
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, year: null, month: null }));
}

export function buildStandaloneResumeCreateInput(
  tenantId: string,
  createdById: string,
  fullName: string,
  options: CreateResumeOptions = {}
): Prisma.ResumeUncheckedCreateInput {
  const documentType = options.documentType ?? ResumeDocumentType.RIREKISHO;
  const templateType = options.templateType ?? ResumeTemplateType.JIS_STANDARD_A4;

  return {
    tenantId,
    candidateId: null,
    createdById,
    updatedById: createdById,
    documentType,
    templateType,
    fullName: fullName.trim(),
    furigana: null,
    birthDate: null,
    postalCode: null,
    address: null,
    phone: null,
    email: null,
    educationJson: [],
    workHistoryJson: [],
    licensesJson: [],
    selfPr: null,
    motivation: null,
    photoUrl: null,
  };
}

export function mapCandidateToResumeCreateInput(
  candidate: CandidateForResumeMapping,
  tenantId: string,
  candidateId: string,
  createdById: string,
  options: CreateResumeOptions = {}
): Prisma.ResumeUncheckedCreateInput {
  const documentType = options.documentType ?? ResumeDocumentType.RIREKISHO;
  const templateType = options.templateType ?? ResumeTemplateType.JIS_STANDARD_A4;
  const licensesJson = mapQualificationsToLicenses(candidate.qualifications);

  return {
    tenantId,
    candidateId,
    createdById,
    updatedById: createdById,
    documentType,
    templateType,
    fullName: fullName(candidate.lastName, candidate.firstName),
    furigana: candidate.furigana?.trim() || null,
    birthDate: candidate.birthDate,
    postalCode: candidate.postalCode?.trim() || null,
    address: candidate.addressLine?.trim() || null,
    phone: candidate.phone?.trim() || null,
    email: candidate.email?.trim() || null,
    educationJson: [],
    workHistoryJson: [],
    licensesJson,
    selfPr: null,
    motivation: null,
    photoUrl: null,
  };
}
