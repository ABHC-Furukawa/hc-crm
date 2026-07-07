"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import {
  inferEducationFromBirthDate,
  parseBirthDateInput,
} from "@/lib/resumes/education-from-birth-date";
import type { ResumeEducationEntry } from "@/lib/resumes/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ResumeEducationInferTool({
  birthDate,
  onApply,
}: {
  birthDate: string;
  onApply: (entries: ResumeEducationEntry[]) => void;
}) {
  const [includeUniversity, setIncludeUniversity] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleInfer() {
    setMessage(null);
    const parsed = parseBirthDateInput(birthDate);
    if (!parsed) {
      setMessage("先に基本情報の生年月日を入力してください。");
      return;
    }

    const inferred = inferEducationFromBirthDate(parsed, { includeUniversity });
    onApply(inferred);
    setMessage("生年月日から学歴の年月を自動入力しました。学校名は編集してください。");
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">学歴の年月を自動入力</p>
          <p className="mt-1 text-xs text-muted-foreground">
            生年月日から小学校〜高校（任意で大学）の入学・卒業年月を逆算します（4月1日基準）。
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleInfer}>
          <Calculator className="mr-2 h-4 w-4" />
          生年月日から自動入力
        </Button>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeUniversity}
          onChange={(e) => setIncludeUniversity(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label className="font-normal">大学まで含める</Label>
      </label>
      {message && (
        <p className="mt-3 text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
