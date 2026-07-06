import { z } from "zod";
import {
  CandidateStatus,
  CommutingArrangement,
  CommuteMeans,
  EmploymentStatus,
  EmploymentType,
  VisionCorrection,
  VisaStatus,
} from "@prisma/client";
import {
  CANDIDATE_SOURCE_KEYS,
  QUALIFICATION_OPTIONS,
  type QualificationKey,
} from "@/lib/constants/candidate-sources";
import { estimateGrossMonthlySalary } from "@/lib/utils/candidate-form-helpers";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalAge = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).max(150).optional()
);

const optionalHeight = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).max(300).optional()
);

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional()
);

const optionalFloat = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0).max(50).optional()
);

const optionalVision = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0).max(3).optional()
);

const optionalDateString = z.preprocess(emptyToUndefined, z.string().optional());

const optionalBool = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  return v === "true";
}, z.boolean().optional());

const optionalYesNo = optionalBool;

function optionalNativeEnum<T extends Record<string, string>>(enumObj: T) {
  return z.preprocess(emptyToUndefined, z.nativeEnum(enumObj).optional());
}

const qualificationKeys = QUALIFICATION_OPTIONS.map((o) => o.key) as [
  QualificationKey,
  ...QualificationKey[],
];

export { loginSchema } from "@/lib/validators/auth";

export const candidateSchema = z
  .object({
    lastName: z.string().min(1, "姓を入力してください"),
    firstName: z.string().min(1, "名を入力してください"),
    furigana: z.string().optional(),
    email: z
      .string()
      .email("有効なメールアドレスを入力してください")
      .optional()
      .or(z.literal("")),
    phone: z.string().min(1, "電話番号を入力してください"),
    phoneSecondary: z.string().optional(),
    birthDate: optionalDateString,
    age: optionalAge,
    postalCode: z.string().optional(),
    addressLine: z.string().optional(),
    status: z.nativeEnum(CandidateStatus),
    source: z
      .string()
      .min(1, "流入経路を選択してください")
      .refine((v) => (CANDIDATE_SOURCE_KEYS as readonly string[]).includes(v), {
        message: "流入経路が不正です",
      }),

    employmentStatus: optionalNativeEnum(EmploymentStatus),
    availableDate: z.string().optional(),
    latestEmploymentType: optionalNativeEnum(EmploymentType),
    dispatchCompany: z.string().optional(),
    resignationReason: z.string().optional(),

    manufacturingExperience: optionalYesNo,
    factoryExperience: optionalYesNo,
    workDescription: z.string().optional(),
    otherCompanySelection: z.string().optional(),

    desiredSalaryNet: optionalInt,
    desiredArea: z.string().optional(),
    commutingArrangement: optionalNativeEnum(CommutingArrangement),
    commuteMeans: optionalNativeEnum(CommuteMeans),
    shiftWork: optionalBool,
    heavyLiftingOk: optionalYesNo,

    height: optionalHeight,
    weight: optionalInt,
    shoeSize: optionalFloat,
    clothingSize: z.string().optional(),
    visionCorrection: optionalNativeEnum(VisionCorrection),
    visionRight: optionalVision,
    visionLeft: optionalVision,

    hasTattoo: optionalYesNo,
    tattooDetail: z.string().optional(),
    hasMedicalTreatment: optionalYesNo,
    medicalTreatmentDetail: z.string().optional(),
    hasDisability: optionalYesNo,
    disabilityDetail: z.string().optional(),

    nationality: z.string().optional(),
    visaStatus: optionalNativeEnum(VisaStatus),
    qualifications: z.array(z.enum(qualificationKeys)).default([]),
    hearingMemo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasTattoo === true && !data.tattooDetail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "タトゥーの詳細を入力してください",
        path: ["tattooDetail"],
      });
    }
    if (data.hasMedicalTreatment === true && !data.medicalTreatmentDetail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "通院中の病気・ケガの内容を入力してください",
        path: ["medicalTreatmentDetail"],
      });
    }
    if (data.hasDisability === true && !data.disabilityDetail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "身体障害・精神障害の内容を入力してください",
        path: ["disabilityDetail"],
      });
    }
  });

export type CandidateFormValues = z.infer<typeof candidateSchema>;

export type CandidateFormValuesSnapshot = Record<string, string>;

export const CANDIDATE_FORM_FIELDS = [
  "lastName",
  "firstName",
  "furigana",
  "email",
  "phone",
  "phoneSecondary",
  "birthDate",
  "age",
  "postalCode",
  "addressLine",
  "status",
  "source",
  "employmentStatus",
  "availableDate",
  "latestEmploymentType",
  "dispatchCompany",
  "resignationReason",
  "manufacturingExperience",
  "factoryExperience",
  "workDescription",
  "otherCompanySelection",
  "desiredSalaryNet",
  "desiredArea",
  "commutingArrangement",
  "commuteMeans",
  "shiftWork",
  "heavyLiftingOk",
  "height",
  "weight",
  "shoeSize",
  "clothingSize",
  "visionCorrection",
  "visionRight",
  "visionLeft",
  "hasTattoo",
  "tattooDetail",
  "hasMedicalTreatment",
  "medicalTreatmentDetail",
  "hasDisability",
  "disabilityDetail",
  "nationality",
  "visaStatus",
  "qualifications",
  "hearingMemo",
] as const;

export function extractCandidateFormValues(formData: FormData): CandidateFormValuesSnapshot {
  const values: CandidateFormValuesSnapshot = {};
  for (const name of CANDIDATE_FORM_FIELDS) {
    if (name === "qualifications") {
      values[name] = formData.getAll("qualifications").join(",");
      continue;
    }
    const raw = formData.get(name);
    values[name] = typeof raw === "string" ? raw : "";
  }
  return values;
}

export const candidateStatusSchema = z.nativeEnum(CandidateStatus);

export function parseFormDataToCandidate(formData: FormData) {
  const qualifications = formData
    .getAll("qualifications")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  return candidateSchema.safeParse({
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName"),
    furigana: formData.get("furigana") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone"),
    phoneSecondary: formData.get("phoneSecondary") || undefined,
    birthDate: formData.get("birthDate"),
    age: formData.get("age"),
    postalCode: formData.get("postalCode") || undefined,
    addressLine: formData.get("addressLine") || undefined,
    status: formData.get("status"),
    source: formData.get("source"),
    employmentStatus: formData.get("employmentStatus"),
    availableDate: formData.get("availableDate"),
    latestEmploymentType: formData.get("latestEmploymentType"),
    dispatchCompany: formData.get("dispatchCompany") || undefined,
    resignationReason: formData.get("resignationReason") || undefined,
    manufacturingExperience: formData.get("manufacturingExperience"),
    factoryExperience: formData.get("factoryExperience"),
    workDescription: formData.get("workDescription") || undefined,
    otherCompanySelection: formData.get("otherCompanySelection") || undefined,
    desiredSalaryNet: formData.get("desiredSalaryNet"),
    desiredArea: formData.get("desiredArea") || undefined,
    commutingArrangement: formData.get("commutingArrangement"),
    commuteMeans: formData.get("commuteMeans"),
    shiftWork: formData.get("shiftWork"),
    heavyLiftingOk: formData.get("heavyLiftingOk"),
    height: formData.get("height"),
    weight: formData.get("weight"),
    shoeSize: formData.get("shoeSize"),
    clothingSize: formData.get("clothingSize") || undefined,
    visionCorrection: formData.get("visionCorrection"),
    visionRight: formData.get("visionRight"),
    visionLeft: formData.get("visionLeft"),
    hasTattoo: formData.get("hasTattoo"),
    tattooDetail: formData.get("tattooDetail") || undefined,
    hasMedicalTreatment: formData.get("hasMedicalTreatment"),
    medicalTreatmentDetail: formData.get("medicalTreatmentDetail") || undefined,
    hasDisability: formData.get("hasDisability"),
    disabilityDetail: formData.get("disabilityDetail") || undefined,
    nationality: formData.get("nationality") || undefined,
    visaStatus: formData.get("visaStatus"),
    qualifications,
    hearingMemo: formData.get("hearingMemo") || undefined,
  });
}

export function toCandidateDbInput(data: CandidateFormValues) {
  const parseDate = (s?: string) => (s ? new Date(s) : null);
  const net = data.desiredSalaryNet ?? null;
  const gross = net != null ? estimateGrossMonthlySalary(net) : null;

  return {
    lastName: data.lastName,
    firstName: data.firstName,
    furigana: data.furigana || null,
    email: data.email || null,
    phone: data.phone,
    phoneSecondary: data.phoneSecondary || null,
    birthDate: parseDate(data.birthDate),
    age: data.age ?? null,
    postalCode: data.postalCode || null,
    addressLine: data.addressLine || null,
    status: data.status,
    source: data.source,
    employmentStatus: data.employmentStatus ?? null,
    availableDate: data.availableDate?.trim() || null,
    latestEmploymentType: data.latestEmploymentType ?? null,
    dispatchCompany: data.dispatchCompany || null,
    resignationReason: data.resignationReason || null,
    manufacturingExperience: data.manufacturingExperience ?? null,
    factoryExperience: data.factoryExperience ?? null,
    workDescription: data.workDescription || null,
    otherCompanySelection: data.otherCompanySelection || null,
    desiredSalaryNet: net,
    desiredSalaryGross: gross,
    desiredArea: data.desiredArea || null,
    commutingArrangement: data.commutingArrangement ?? null,
    commuteMeans: data.commuteMeans ?? null,
    shiftWork: data.shiftWork ?? null,
    heavyLiftingOk: data.heavyLiftingOk ?? null,
    height: data.height ?? null,
    weight: data.weight ?? null,
    shoeSize: data.shoeSize ?? null,
    clothingSize: data.clothingSize?.trim() || null,
    visionCorrection: data.visionCorrection ?? null,
    visionRight: data.visionRight ?? null,
    visionLeft: data.visionLeft ?? null,
    hasTattoo: data.hasTattoo ?? null,
    tattooDetail: data.hasTattoo === true ? data.tattooDetail || null : null,
    hasMedicalTreatment: data.hasMedicalTreatment ?? null,
    medicalTreatmentDetail:
      data.hasMedicalTreatment === true ? data.medicalTreatmentDetail || null : null,
    hasDisability: data.hasDisability ?? null,
    disabilityDetail: data.hasDisability === true ? data.disabilityDetail || null : null,
    nationality: data.nationality || null,
    visaStatus: data.visaStatus ?? null,
    qualifications: data.qualifications,
    hearingMemo: data.hearingMemo || null,
  };
}

export const CANDIDATE_STATUS_ORDER = [
  "HEARING",
  "JOB_PROPOSAL",
  "ENTRY",
  "INTERVIEW_PREP",
  "FIRST_INTERVIEW",
  "FACTORY_TOUR",
  "OFFER_ACCEPTED",
  "JOINED",
  "WITHDRAWN",
  "REJECTED",
  "UNREACHABLE",
  "NOT_REFERRABLE",
  "LOST",
] as const satisfies readonly CandidateStatus[];

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  HEARING: "ヒアリング",
  JOB_PROPOSAL: "案件提案",
  ENTRY: "エントリー",
  INTERVIEW_PREP: "面談対策",
  FIRST_INTERVIEW: "一次面接",
  FACTORY_TOUR: "工場見学",
  OFFER_ACCEPTED: "内定承諾",
  JOINED: "入社",
  WITHDRAWN: "辞退",
  REJECTED: "不採用",
  UNREACHABLE: "不通",
  NOT_REFERRABLE: "紹介不可",
  LOST: "失注",
};

export const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  HEARING: "bg-blue-100 text-blue-800 border-blue-200",
  JOB_PROPOSAL: "bg-indigo-100 text-indigo-800 border-indigo-200",
  ENTRY: "bg-violet-100 text-violet-800 border-violet-200",
  INTERVIEW_PREP: "bg-purple-100 text-purple-800 border-purple-200",
  FIRST_INTERVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  FACTORY_TOUR: "bg-yellow-100 text-yellow-800 border-yellow-200",
  OFFER_ACCEPTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  JOINED: "bg-green-100 text-green-800 border-green-200",
  WITHDRAWN: "bg-orange-100 text-orange-800 border-orange-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  UNREACHABLE: "bg-slate-100 text-slate-800 border-slate-200",
  NOT_REFERRABLE: "bg-rose-100 text-rose-800 border-rose-200",
  LOST: "bg-gray-100 text-gray-800 border-gray-200",
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  EMPLOYED: "就業中",
  UNEMPLOYED: "離職中",
  DISPATCH: "派遣中",
  PART_TIME: "アルバイト",
  STUDENT: "学生",
  OTHER: "その他",
  UNKNOWN: "未確認",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "正社員",
  PART_TIME: "パート・アルバイト",
  DISPATCH: "派遣",
  CONTRACT: "契約社員",
  TEMPORARY: "臨時",
  OTHER: "その他",
  UNKNOWN: "未確認",
};

export const VISION_CORRECTION_LABELS: Record<VisionCorrection, string> = {
  NAKED_EYE: "裸眼",
  GLASSES: "眼鏡",
  CONTACT: "コンタクト",
  UNKNOWN: "未確認",
};

export function formatVision(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toFixed(1);
}

export const VISA_STATUS_LABELS: Record<VisaStatus, string> = {
  JAPANESE: "日本籍",
  PERMANENT: "永住者",
  WORK: "就労ビザ",
  STUDENT: "留学",
  DEPENDENT: "家族滞在",
  SPECIFIED_SKILLED: "特定技能",
  OTHER: "その他",
  UNKNOWN: "未確認",
};

export function formatBoolLabel(value: boolean | null | undefined): string {
  if (value === true) return "可";
  if (value === false) return "不可";
  return "—";
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function displayFurigana(candidate: {
  furigana?: string | null;
  lastNameKana?: string | null;
  firstNameKana?: string | null;
}): string | null {
  if (candidate.furigana) return candidate.furigana;
  if (candidate.lastNameKana || candidate.firstNameKana) {
    return `${candidate.lastNameKana ?? ""} ${candidate.firstNameKana ?? ""}`.trim();
  }
  return null;
}

export function boolToSelect(value?: boolean | null): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

export function yesNoToSelect(value?: boolean | null): string {
  return boolToSelect(value);
}

export function experienceToSelect(value?: boolean | null): string {
  return boolToSelect(value);
}
