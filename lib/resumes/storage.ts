import { createAdminClient } from "@/lib/supabase/admin";
import {
  RESUME_PHOTOS_BUCKET,
  RESUME_PHOTO_ALLOWED_TYPES,
  RESUME_PHOTO_MAX_BYTES,
} from "@/lib/resumes/constants";

export function isResumePhotoConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function validateResumePhotoFile(file: File): string | null {
  if (!RESUME_PHOTO_ALLOWED_TYPES.includes(file.type as (typeof RESUME_PHOTO_ALLOWED_TYPES)[number])) {
    return "JPEG / PNG / WebP 形式の画像を選択してください";
  }
  if (file.size > RESUME_PHOTO_MAX_BYTES) {
    return "画像サイズは 2MB 以下にしてください";
  }
  return null;
}

export function buildResumePhotoStoragePath(
  tenantId: string,
  resumeId: string,
  mimeType: string,
  candidateId?: string | null
): string {
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const folder = candidateId ?? "standalone";
  return `${tenantId}/${folder}/${resumeId}/photo.${ext}`;
}

export async function uploadResumePhotoToStorage(
  storagePath: string,
  file: File
): Promise<void> {
  const supabase = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(RESUME_PHOTOS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`写真のアップロードに失敗しました: ${error.message}`);
  }
}

export async function getResumePhotoSignedUrl(
  storagePath: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> {
  if (!storagePath || !isResumePhotoConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(RESUME_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
