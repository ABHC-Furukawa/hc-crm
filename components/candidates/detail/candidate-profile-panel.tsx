"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { CandidateDetail } from "@/types/candidate";
import { CandidateForm } from "@/components/candidates/candidate-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import {
  getCandidateSourceLabel,
  formatQualifications,
} from "@/lib/constants/candidate-sources";
import {
  COMMUTE_MEANS_LABELS,
  COMMUTING_ARRANGEMENT_LABELS,
  formatHasExperience,
  formatPostalCode,
  formatYesNo,
} from "@/lib/utils/candidate-form-helpers";
import {
  CANDIDATE_STATUS_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  VISA_STATUS_LABELS,
  VISION_CORRECTION_LABELS,
  displayFurigana,
  formatBoolLabel,
  formatVision,
} from "@/lib/validators/candidate";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { CommutingArrangement, CommuteMeans } from "@prisma/client";

export function CandidateProfilePanel({ candidate }: { candidate: CandidateDetail }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  function handleSaved() {
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>情報を編集</CardTitle>
            <CardDescription>変更後に「変更を保存」を押してください</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
            キャンセル
          </Button>
        </CardHeader>
        <CardContent>
          <CandidateForm mode="edit" candidate={candidate} onSaved={handleSaved} />
        </CardContent>
      </Card>
    );
  }

  return <CandidateProfileView candidate={candidate} onEdit={() => setEditing(true)} />;
}

function CandidateProfileView({
  candidate,
  onEdit,
}: {
  candidate: CandidateDetail;
  onEdit: () => void;
}) {
  const furigana = displayFurigana(candidate);
  const addressDisplay = [
    candidate.postalCode ? formatPostalCode(candidate.postalCode) : null,
    candidate.addressLine,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>プロフィール</CardTitle>
          <CardDescription>{CANDIDATE_DISPLAY.profileDescription}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          編集
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProfileSection title="基本情報">
          <ProfileField label="フリガナ" value={furigana ?? "—"} />
          <ProfileField label="電話番号" value={candidate.phone} />
          <ProfileField label="電話番号（副）" value={candidate.phoneSecondary ?? "—"} />
          <ProfileField
            label="生年月日"
            value={candidate.birthDate ? formatDate(candidate.birthDate) : "—"}
          />
          <ProfileField
            label="年齢"
            value={candidate.age != null ? `${candidate.age}歳` : "—"}
          />
          <ProfileField label="メール" value={candidate.email ?? "—"} />
          <ProfileField label="住所" value={addressDisplay || "—"} className="sm:col-span-2" />
          <ProfileField label="ステータス" value={CANDIDATE_STATUS_LABELS[candidate.status]} />
          <ProfileField label="流入経路" value={getCandidateSourceLabel(candidate.source)} />
        </ProfileSection>

        <ProfileSection title="就業状況">
          <ProfileField
            label="就業状況"
            value={labelOrDash(candidate.employmentStatus, EMPLOYMENT_STATUS_LABELS)}
          />
          <ProfileField
            label="稼働可能日"
            value={candidate.availableDate ? formatDate(candidate.availableDate) : "—"}
          />
          <ProfileField
            label="直近の雇用形態"
            value={labelOrDash(candidate.latestEmploymentType, EMPLOYMENT_TYPE_LABELS)}
          />
          <ProfileField label="派遣会社" value={candidate.dispatchCompany ?? "—"} />
          <ProfileField
            label="退職理由"
            value={candidate.resignationReason ?? "—"}
            className="sm:col-span-2"
          />
        </ProfileSection>

        <ProfileSection title="職歴">
          <ProfileField
            label="製造経験"
            value={formatHasExperience(candidate.manufacturingExperience)}
          />
          <ProfileField
            label="工場経験"
            value={formatHasExperience(candidate.factoryExperience)}
          />
          <ProfileField
            label="他社の選考状況"
            value={candidate.otherCompanySelection ?? "—"}
            className="sm:col-span-2"
          />
          <ProfileField
            label="職務内容"
            value={candidate.workDescription ?? "—"}
            className="sm:col-span-2"
          />
        </ProfileSection>

        <ProfileSection title="希望条件">
          <ProfileField
            label="希望手取り"
            value={
              candidate.desiredSalaryNet != null
                ? `${candidate.desiredSalaryNet}万円`
                : "—"
            }
          />
          <ProfileField
            label="月収目安"
            value={
              candidate.desiredSalaryGross != null
                ? `${candidate.desiredSalaryGross}万円`
                : "—"
            }
          />
          <ProfileField label="希望勤務地" value={candidate.desiredArea ?? "—"} />
          <ProfileField
            label="通勤方法"
            value={labelOrDash(
              candidate.commutingArrangement,
              COMMUTING_ARRANGEMENT_LABELS as Record<CommutingArrangement, string>
            )}
          />
          <ProfileField
            label="通勤手段"
            value={labelOrDash(
              candidate.commuteMeans,
              COMMUTE_MEANS_LABELS as Record<CommuteMeans, string>
            )}
          />
          <ProfileField label="交替勤務" value={formatBoolLabel(candidate.shiftWork)} />
          <ProfileField
            label="重量物の取り扱い"
            value={
              candidate.heavyLiftingOk === true
                ? "OK"
                : candidate.heavyLiftingOk === false
                  ? "NG"
                  : "—"
            }
          />
        </ProfileSection>

        <ProfileSection title="身体情報">
          <ProfileField
            label="身長"
            value={candidate.height != null ? `${candidate.height}cm` : "—"}
          />
          <ProfileField
            label="体重"
            value={candidate.weight != null ? `${candidate.weight}kg` : "—"}
          />
          <ProfileField
            label="靴サイズ"
            value={candidate.shoeSize != null ? `${candidate.shoeSize}cm` : "—"}
          />
          <ProfileField
            label="服のサイズ"
            value={candidate.clothingSize?.trim() || "—"}
          />
          <ProfileField
            label="視力（矯正）"
            value={labelOrDash(candidate.visionCorrection, VISION_CORRECTION_LABELS)}
          />
          <ProfileField label="視力 右" value={formatVision(candidate.visionRight)} />
          <ProfileField label="視力 左" value={formatVision(candidate.visionLeft)} />
          <ProfileField
            label="通院中の病気・ケガ"
            value={formatYesNoDetail(
              candidate.hasMedicalTreatment,
              candidate.medicalTreatmentDetail
            )}
            className="sm:col-span-2"
          />
          <ProfileField
            label="身体障害・精神障害"
            value={formatYesNoDetail(candidate.hasDisability, candidate.disabilityDetail)}
            className="sm:col-span-2"
          />
          <ProfileField
            label="タトゥー"
            value={formatYesNoDetail(candidate.hasTattoo, candidate.tattooDetail)}
            className="sm:col-span-2"
          />
        </ProfileSection>

        <ProfileSection title="その他">
          <ProfileField label="国籍" value={candidate.nationality ?? "—"} />
          <ProfileField
            label="在留資格"
            value={labelOrDash(candidate.visaStatus, VISA_STATUS_LABELS)}
          />
          <ProfileField
            label="保有資格"
            value={formatQualifications(candidate.qualifications)}
            className="sm:col-span-2"
          />
          <ProfileField
            label="ヒアリングメモ"
            value={candidate.hearingMemo ?? "—"}
            className="sm:col-span-2"
          />
        </ProfileSection>

        <dl className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-2">
          <ProfileField label="登録日" value={formatDateTime(candidate.createdAt)} />
          <ProfileField label="最終更新" value={formatDateTime(candidate.updatedAt)} />
        </dl>
      </CardContent>
    </Card>
  );
}

function formatYesNoDetail(has: boolean | null | undefined, detail: string | null): string {
  if (has == null) return "—";
  if (!has) return "なし";
  return detail?.trim() ? `あり（${detail}）` : "あり";
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function ProfileField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap font-medium">{value}</dd>
    </div>
  );
}

function labelOrDash<T extends string>(
  key: T | null | undefined,
  labels: Record<T, string>
): string {
  if (!key) return "—";
  return labels[key] ?? "—";
}
