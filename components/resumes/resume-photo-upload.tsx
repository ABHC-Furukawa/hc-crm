"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import {
  uploadResumePhotoAction,
  type ResumeActionState,
} from "@/lib/actions/resumes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ResumePhotoUpload({
  resumeId,
  photoDisplayUrl,
}: {
  resumeId: string;
  photoDisplayUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    uploadResumePhotoAction.bind(null, resumeId),
    {} as ResumeActionState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div className="space-y-3">
      <Label>証明写真</Label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {photoDisplayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoDisplayUrl}
              alt="証明写真"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs text-muted-foreground">
              未設定
            </span>
          )}
        </div>
        <form action={formAction} className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
          />
          <p className="text-xs text-muted-foreground">JPEG / PNG / WebP、2MB 以下</p>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            <ImagePlus className="mr-2 h-4 w-4" />
            {pending ? "アップロード中…" : "写真をアップロード"}
          </Button>
        </form>
      </div>
    </div>
  );
}
