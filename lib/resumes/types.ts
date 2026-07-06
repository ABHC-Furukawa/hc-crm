import type {
  Resume,
  ResumeDocumentType,
  ResumeGender,
  ResumeStatus,
  ResumeTemplateType,
} from "@prisma/client";

export type ResumeEducationEvent = "入学" | "卒業" | "中退";

export type ResumeEducationEntry = {
  year: number;
  month: number;
  school: string;
  event: ResumeEducationEvent;
};

export type ResumeWorkHistoryEvent = "入社" | "退社";

export type ResumeWorkHistoryEntry = {
  year: number;
  month: number;
  company: string;
  event: ResumeWorkHistoryEvent;
  description?: string | null;
};

export type ResumeLicenseEntry = {
  year?: number | null;
  month?: number | null;
  name: string;
};

export type ResumeJsonFields = {
  educationJson: ResumeEducationEntry[];
  workHistoryJson: ResumeWorkHistoryEntry[];
  licensesJson: ResumeLicenseEntry[];
};

export type ResumeFormValues = {
  fullName: string;
  furigana?: string | null;
  birthDate?: string | null;
  gender?: ResumeGender | null;
  postalCode?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  educationJson: ResumeEducationEntry[];
  workHistoryJson: ResumeWorkHistoryEntry[];
  licensesJson: ResumeLicenseEntry[];
  selfPr?: string | null;
  motivation?: string | null;
  photoUrl?: string | null;
  status?: ResumeStatus;
};

export type ResumeSummary = Pick<
  Resume,
  | "id"
  | "candidateId"
  | "documentType"
  | "templateType"
  | "status"
  | "fullName"
  | "updatedAt"
  | "createdAt"
>;

export type CreateResumeOptions = {
  documentType?: ResumeDocumentType;
  templateType?: ResumeTemplateType;
};
