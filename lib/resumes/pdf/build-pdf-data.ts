import { createAdminClient } from "@/lib/supabase/admin";
import type { ResumeDetail } from "@/lib/resumes/queries";
import { parseResumeJsonFields } from "@/lib/resumes/parse-json";
import { RESUME_PHOTOS_BUCKET } from "@/lib/resumes/constants";
import { formatDate } from "@/lib/utils";
import {
  genderToPdfLabel,
  type ResumePdfData,
} from "@/lib/resumes/pdf/types";

async function loadPhotoDataUri(
  storagePath: string | null | undefined
): Promise<string | null> {
  if (!storagePath) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(RESUME_PHOTOS_BUCKET)
      .download(storagePath);

    if (error || !data) return null;

    const buffer = Buffer.from(await data.arrayBuffer());
    const ext = storagePath.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function buildResumePdfData(
  resume: ResumeDetail
): Promise<ResumePdfData> {
  const jsonFields = parseResumeJsonFields(resume);
  const photoDataUri = await loadPhotoDataUri(resume.photoUrl);

  return {
    fullName: resume.fullName,
    furigana: resume.furigana,
    birthDateLabel: resume.birthDate
      ? `${formatDate(resume.birthDate)} 生`
      : null,
    genderLabel: genderToPdfLabel(resume.gender),
    postalCode: resume.postalCode,
    address: resume.address,
    phone: resume.phone,
    email: resume.email,
    selfPr: resume.selfPr,
    motivation: resume.motivation,
    createdDateLabel: formatDate(new Date()),
    photoDataUri,
    ...jsonFields,
  };
}
