"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save } from "lucide-react";
import type { ResumeGender, ResumeStatus } from "@prisma/client";
import {
  updateResumeAction,
  type ResumeActionState,
} from "@/lib/actions/resumes";
import type { ResumeDetail } from "@/lib/resumes/queries";
import type { ResumeJsonFields } from "@/lib/resumes/types";
import {
  RESUME_GENDER_LABELS,
  RESUME_STATUS_LABELS,
} from "@/lib/resumes/constants";
import { toDateInputValue } from "@/lib/validators/candidate";
import {
  ResumeEducationFields,
  ResumeLicenseFields,
  ResumeWorkHistoryFields,
} from "@/components/resumes/resume-dynamic-fields";
import { ResumePhotoUpload } from "@/components/resumes/resume-photo-upload";
import { ResumeSyncButton } from "@/components/resumes/resume-summary-panel";
import { ResumeCandidateLink } from "@/components/resumes/resume-nav-links";
import { ResumePdfActions } from "@/components/resumes/resume-pdf-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ResumeForm({
  resume,
  jsonFields,
  photoDisplayUrl,
}: {
  resume: ResumeDetail;
  jsonFields: ResumeJsonFields;
  photoDisplayUrl: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateResumeAction.bind(null, resume.id),
    {} as ResumeActionState
  );
  const wasPending = useRef(false);

  const [education, setEducation] = useState(jsonFields.educationJson);
  const [workHistory, setWorkHistory] = useState(jsonFields.workHistoryJson);
  const [licenses, setLicenses] = useState(jsonFields.licensesJson);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="educationJson" value={JSON.stringify(education)} />
      <input type="hidden" name="workHistoryJson" value={JSON.stringify(workHistory)} />
      <input type="hidden" name="licensesJson" value={JSON.stringify(licenses)} />
      <input type="hidden" name="photoUrl" value={resume.photoUrl ?? ""} />

      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-800 dark:text-green-200">
          保存しました
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          {resume.candidateId ? (
            <ResumeSyncButton resumeId={resume.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              候補者未紐づけの履歴書です。すべての項目を自由に編集できます。
            </p>
          )}
          <ResumeCandidateLink resume={resume} />
        </div>
        <div className="flex flex-wrap gap-2">
          <ResumePdfActions resumeId={resume.id} />
          <Button type="button" variant="outline" asChild>
            <Link href={`/resumes/${resume.id}/preview`}>
              <Eye className="mr-2 h-4 w-4" />
              プレビュー
            </Link>
          </Button>
          <Button type="submit" disabled={pending}>
            <Save className="mr-2 h-4 w-4" />
            {pending ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>
            自動反映された値も含め、保存前にいつでも編集できます
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">氏名</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={resume.fullName}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="furigana">ふりがな</Label>
            <Input id="furigana" name="furigana" defaultValue={resume.furigana ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">生年月日</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={toDateInputValue(resume.birthDate)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">性別</Label>
            <select
              id="gender"
              name="gender"
              className={selectClass}
              defaultValue={resume.gender ?? ""}
            >
              <option value="">未記入</option>
              {(Object.keys(RESUME_GENDER_LABELS) as ResumeGender[]).map((key) => (
                <option key={key} value={key}>
                  {RESUME_GENDER_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">郵便番号</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={resume.postalCode ?? ""}
              placeholder="123-4567"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">住所</Label>
            <Input id="address" name="address" defaultValue={resume.address ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input id="phone" name="phone" defaultValue={resume.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={resume.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">ステータス</Label>
            <select
              id="status"
              name="status"
              className={selectClass}
              defaultValue={resume.status}
            >
              {(Object.keys(RESUME_STATUS_LABELS) as ResumeStatus[]).map((key) => (
                <option key={key} value={key}>
                  {RESUME_STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>証明写真</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumePhotoUpload resumeId={resume.id} photoDisplayUrl={photoDisplayUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>学歴</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeEducationFields entries={education} onChange={setEducation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>職歴</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeWorkHistoryFields entries={workHistory} onChange={setWorkHistory} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>資格・免許</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeLicenseFields entries={licenses} onChange={setLicenses} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自己PR・志望動機</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="selfPr">自己PR</Label>
            <Textarea
              id="selfPr"
              name="selfPr"
              rows={5}
              defaultValue={resume.selfPr ?? ""}
              placeholder="あなたの強みや経験を記入してください"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivation">志望動機</Label>
            <Textarea
              id="motivation"
              name="motivation"
              rows={5}
              defaultValue={resume.motivation ?? ""}
              placeholder="志望理由を記入してください"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : "保存"}
        </Button>
      </div>
    </form>
  );
}
