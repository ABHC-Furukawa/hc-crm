"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Candidate } from "@prisma/client";
import {
  createCandidateAction,
  updateCandidateAction,
  type CandidateActionState,
} from "@/lib/actions/candidates";
import {
  CANDIDATE_SOURCE_OPTIONS,
  QUALIFICATION_OPTIONS,
} from "@/lib/constants/candidate-sources";
import {
  COMMUTE_MEANS_LABELS,
  COMMUTING_ARRANGEMENT_LABELS,
  calculateAgeFromBirthDate,
  estimateGrossMonthlySalary,
  formatPostalCode,
  joinCandidateFullName,
  lookupAddressByPostalCode,
  splitCandidateFullName,
} from "@/lib/utils/candidate-form-helpers";
import {
  CANDIDATE_STATUS_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  VISA_STATUS_LABELS,
  VISION_CORRECTION_LABELS,
  boolToSelect,
  displayFurigana,
  experienceToSelect,
  toDateInputValue,
  type CandidateFormValuesSnapshot,
} from "@/lib/validators/candidate";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import {
  YesNoDetailFieldInteractive,
  inputErrorClass,
  selectClass,
  selectErrorClass,
} from "@/components/candidates/form/form-field-primitives";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CandidateFormProps = {
  candidate?: Candidate;
  mode: "create" | "edit";
  onSaved?: () => void;
};

export function CandidateForm({ candidate, mode, onSaved }: CandidateFormProps) {
  const action =
    mode === "create"
      ? createCandidateAction
      : updateCandidateAction.bind(null, candidate!.id);

  const [state, formAction, pending] = useActionState(action, {} as CandidateActionState);
  const wasPending = useRef(false);
  const router = useRouter();
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const furiganaTouched = useRef(false);

  const values = state.values;
  const fieldErrors = state.fieldErrors ?? {};
  const formKey = state.formToken ?? "initial";

  const val = (name: keyof CandidateFormValuesSnapshot, fallback = "") =>
    values?.[name] ?? fallback;

  const initialLastName = val("lastName", candidate?.lastName ?? "");
  const initialFirstName = val("firstName", candidate?.firstName ?? "");
  const initialFullName =
    val("fullName") ||
    joinCandidateFullName(initialLastName, initialFirstName);
  const initialFurigana =
    val("furigana") || candidate?.furigana || displayFurigana(candidate ?? {}) || "";
  const initialBirthDate = val("birthDate", toDateInputValue(candidate?.birthDate));
  const initialAge =
    val("age") ||
    (initialBirthDate ? String(calculateAgeFromBirthDate(initialBirthDate) ?? "") : "") ||
    candidate?.age?.toString() ||
    "";
  const initialPostal = val("postalCode", candidate?.postalCode ?? "");
  const initialAddress = val("addressLine", candidate?.addressLine ?? "");
  const initialSalaryNet = val(
    "desiredSalaryNet",
    candidate?.desiredSalaryNet?.toString() ?? ""
  );
  const initialQualifications =
    values?.qualifications?.split(",").filter(Boolean) ??
    candidate?.qualifications ??
    [];

  const [fullName, setFullName] = useState(initialFullName);
  const [lastName, setLastName] = useState(initialLastName);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [furigana, setFurigana] = useState(initialFurigana);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [age, setAge] = useState(initialAge);
  const [postalCode, setPostalCode] = useState(initialPostal);
  const [addressLine, setAddressLine] = useState(initialAddress);
  const [salaryNet, setSalaryNet] = useState(initialSalaryNet);
  const [hasTattoo, setHasTattoo] = useState(
    val("hasTattoo", yesNoToSelect(candidate?.hasTattoo))
  );
  const [hasMedical, setHasMedical] = useState(
    val("hasMedicalTreatment", yesNoToSelect(candidate?.hasMedicalTreatment))
  );
  const [hasDisability, setHasDisability] = useState(
    val("hasDisability", yesNoToSelect(candidate?.hasDisability))
  );

  const salaryGross = useMemo(() => {
    const net = Number(salaryNet);
    if (!salaryNet || Number.isNaN(net) || net <= 0) return "";
    return String(estimateGrossMonthlySalary(net));
  }, [salaryNet]);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      router.refresh();
      onSaved?.();
    }
    wasPending.current = pending;
  }, [pending, state.success, onSaved, router]);

  useEffect(() => {
    if (state.error || state.fieldErrors) {
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.error, state.fieldErrors, state.formToken]);

  // Reset local state when server returns preserved values after error
  useEffect(() => {
    if (!state.values) return;
    setFullName(
      state.values.fullName ??
        joinCandidateFullName(
          state.values.lastName ?? "",
          state.values.firstName ?? ""
        )
    );
    setLastName(state.values.lastName ?? "");
    setFirstName(state.values.firstName ?? "");
    setFurigana(state.values.furigana ?? "");
    setBirthDate(state.values.birthDate ?? "");
    setAge(state.values.age ?? "");
    setPostalCode(state.values.postalCode ?? "");
    setAddressLine(state.values.addressLine ?? "");
    setSalaryNet(state.values.desiredSalaryNet ?? "");
    setHasTattoo(state.values.hasTattoo ?? "");
    setHasMedical(state.values.hasMedicalTreatment ?? "");
    setHasDisability(state.values.hasDisability ?? "");
    furiganaTouched.current = Boolean(state.values.furigana);
  }, [state.formToken, state.values]);

  useEffect(() => {
    if (!birthDate) {
      setAge("");
      return;
    }
    const computed = calculateAgeFromBirthDate(birthDate);
    if (computed != null) setAge(String(computed));
  }, [birthDate]);

  function handleFullNameChange(value: string) {
    setFullName(value);
    const split = splitCandidateFullName(value);
    setLastName(split.lastName);
    setFirstName(split.firstName);
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (furiganaTouched.current) return;
      if (!lastName.trim() && !firstName.trim()) return;
      try {
        const res = await fetch("/api/furigana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastName, firstName }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { furigana?: string };
        if (data.furigana && !furiganaTouched.current) {
          setFurigana(data.furigana);
        }
      } catch {
        // ignore conversion failures
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [lastName, firstName]);

  async function handlePostalBlur() {
    const result = await lookupAddressByPostalCode(postalCode);
    if (!result) return;
    const line = `${result.address1}${result.address2}${result.address3}`;
    if (line) setAddressLine(line);
  }

  return (
    <form key={formKey} action={formAction} className="space-y-8">
      {(state.error || Object.keys(fieldErrors).length > 0) && (
        <div
          ref={errorBannerRef}
          role="alert"
          className="rounded-lg border-2 border-destructive bg-destructive/10 p-4"
        >
          <p className="font-semibold text-destructive">
            {state.error ?? "入力内容に誤りがあります"}
          </p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-destructive">
              {Object.entries(fieldErrors).flatMap(([field, messages]) =>
                messages.map((message) => (
                  <li key={`${field}-${message}`}>
                    {FIELD_LABELS[field] ?? field}: {message}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      <FormSection title="基本情報">
        <div className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="lastName" value={lastName} />
          <input type="hidden" name="firstName" value={firstName} />
          <Field
            label="氏名 *"
            name="fullName"
            value={fullName}
            onChange={(e) => handleFullNameChange(e.target.value)}
            required
            className="sm:col-span-2"
            placeholder="例: 山田 太郎"
            error={fieldErrors.lastName?.[0] ?? fieldErrors.firstName?.[0]}
          />
          <Field
            label="フリガナ（カタカナ）"
            name="furigana"
            value={furigana}
            onChange={(e) => {
              furiganaTouched.current = true;
              setFurigana(e.target.value);
            }}
            className="sm:col-span-2"
            placeholder="姓・名入力で自動入力（編集可）"
            error={fieldErrors.furigana?.[0]}
          />
          <Field
            label="電話番号 *"
            name="phone"
            type="tel"
            defaultValue={val("phone", candidate?.phone ?? "")}
            required
            placeholder="09012345678"
            error={fieldErrors.phone?.[0]}
          />
          <Field
            label="電話番号（副）"
            name="phoneSecondary"
            type="tel"
            defaultValue={val("phoneSecondary", candidate?.phoneSecondary ?? "")}
            error={fieldErrors.phoneSecondary?.[0]}
          />
          <Field
            label="生年月日"
            name="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={fieldErrors.birthDate?.[0]}
          />
          <Field
            label="年齢"
            name="age"
            type="number"
            value={age}
            readOnly
            className="bg-muted"
            min={0}
            max={150}
            error={fieldErrors.age?.[0]}
          />
          <Field
            label="メールアドレス"
            name="email"
            type="email"
            defaultValue={val("email", candidate?.email ?? "")}
            className="sm:col-span-2"
            error={fieldErrors.email?.[0]}
          />
          <Field
            label="郵便番号"
            name="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(formatPostalCode(e.target.value))}
            onBlur={handlePostalBlur}
            placeholder="123-4567"
            error={fieldErrors.postalCode?.[0]}
          />
          <div className="hidden sm:block" />
          <Field
            label="住所"
            name="addressLine"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            className="sm:col-span-2"
            error={fieldErrors.addressLine?.[0]}
          />
          <SelectField
            label="ステータス"
            name="status"
            defaultValue={val("status", candidate?.status ?? "HEARING")}
            options={CANDIDATE_STATUS_LABELS}
            error={fieldErrors.status?.[0]}
          />
          <SelectField
            label="流入経路"
            name="source"
            defaultValue={val("source", candidate?.source ?? "OTHER")}
            options={Object.fromEntries(
              CANDIDATE_SOURCE_OPTIONS.map((o) => [o.key, o.label])
            )}
            error={fieldErrors.source?.[0]}
          />
        </div>
      </FormSection>

      <FormSection title="就業状況">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="就業状況"
            name="employmentStatus"
            defaultValue={val("employmentStatus", candidate?.employmentStatus ?? "")}
            options={EMPLOYMENT_STATUS_LABELS}
            optional
            error={fieldErrors.employmentStatus?.[0]}
          />
          <Field
            label="稼働可能日"
            name="availableDate"
            defaultValue={val("availableDate", candidate?.availableDate ?? "")}
            placeholder="例: 来週から可、7/15〜"
            error={fieldErrors.availableDate?.[0]}
          />
          <SelectField
            label="直近の雇用形態"
            name="latestEmploymentType"
            defaultValue={val("latestEmploymentType", candidate?.latestEmploymentType ?? "")}
            options={EMPLOYMENT_TYPE_LABELS}
            optional
            error={fieldErrors.latestEmploymentType?.[0]}
          />
          <Field
            label="派遣会社"
            name="dispatchCompany"
            defaultValue={val("dispatchCompany", candidate?.dispatchCompany ?? "")}
            error={fieldErrors.dispatchCompany?.[0]}
          />
          <TextField
            label="退職理由"
            name="resignationReason"
            defaultValue={val("resignationReason", candidate?.resignationReason ?? "")}
            className="sm:col-span-2"
            error={fieldErrors.resignationReason?.[0]}
          />
        </div>
      </FormSection>

      <FormSection title="職歴">
        <div className="grid gap-4 sm:grid-cols-2">
          <YesNoExperienceSelect
            label="製造経験"
            name="manufacturingExperience"
            defaultValue={val(
              "manufacturingExperience",
              experienceToSelect(candidate?.manufacturingExperience)
            )}
            error={fieldErrors.manufacturingExperience?.[0]}
          />
          <YesNoExperienceSelect
            label="工場経験"
            name="factoryExperience"
            defaultValue={val(
              "factoryExperience",
              experienceToSelect(candidate?.factoryExperience)
            )}
            error={fieldErrors.factoryExperience?.[0]}
          />
          <TextField
            label="他社の選考状況"
            name="otherCompanySelection"
            defaultValue={val(
              "otherCompanySelection",
              candidate?.otherCompanySelection ?? ""
            )}
            className="sm:col-span-2"
            rows={3}
            error={fieldErrors.otherCompanySelection?.[0]}
          />
          <TextField
            label="職務内容"
            name="workDescription"
            defaultValue={val("workDescription", candidate?.workDescription ?? "")}
            className="sm:col-span-2"
            rows={4}
            error={fieldErrors.workDescription?.[0]}
          />
        </div>
      </FormSection>

      <FormSection title="希望条件">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="希望手取り（万円）"
            name="desiredSalaryNet"
            type="number"
            value={salaryNet}
            onChange={(e) => setSalaryNet(e.target.value)}
            min={0}
            error={fieldErrors.desiredSalaryNet?.[0]}
          />
          <div className="space-y-2">
            <Label>月収目安（万円）</Label>
            <Input
              readOnly
              value={salaryGross}
              placeholder="手取り入力で自動計算"
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">概算（手取り ÷ 0.78）</p>
          </div>
          <Field
            label="希望勤務地"
            name="desiredArea"
            defaultValue={val("desiredArea", candidate?.desiredArea ?? "")}
            error={fieldErrors.desiredArea?.[0]}
          />
          <SelectField
            label="通勤方法"
            name="commutingArrangement"
            defaultValue={val(
              "commutingArrangement",
              candidate?.commutingArrangement ?? ""
            )}
            options={COMMUTING_ARRANGEMENT_LABELS}
            optional
            error={fieldErrors.commutingArrangement?.[0]}
          />
          <SelectField
            label="通勤手段"
            name="commuteMeans"
            defaultValue={val("commuteMeans", candidate?.commuteMeans ?? "")}
            options={COMMUTE_MEANS_LABELS}
            optional
            error={fieldErrors.commuteMeans?.[0]}
          />
          <BoolSelect
            label="交替勤務"
            name="shiftWork"
            defaultValue={val("shiftWork", boolToSelect(candidate?.shiftWork))}
            error={fieldErrors.shiftWork?.[0]}
          />
          <YesNoOkNgSelect
            label="重量物の取り扱い"
            name="heavyLiftingOk"
            defaultValue={val("heavyLiftingOk", boolToSelect(candidate?.heavyLiftingOk))}
            error={fieldErrors.heavyLiftingOk?.[0]}
          />
        </div>
      </FormSection>

      <FormSection title="身体情報">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="身長（cm）"
            name="height"
            type="number"
            defaultValue={val("height", candidate?.height?.toString() ?? "")}
            min={0}
            error={fieldErrors.height?.[0]}
          />
          <Field
            label="体重（kg）"
            name="weight"
            type="number"
            defaultValue={val("weight", candidate?.weight?.toString() ?? "")}
            min={0}
            error={fieldErrors.weight?.[0]}
          />
          <Field
            label="靴サイズ（cm）"
            name="shoeSize"
            type="number"
            step="0.5"
            defaultValue={val("shoeSize", candidate?.shoeSize?.toString() ?? "")}
            min={0}
            error={fieldErrors.shoeSize?.[0]}
          />
          <Field
            label="服のサイズ"
            name="clothingSize"
            placeholder="例: L, LL"
            defaultValue={val("clothingSize", candidate?.clothingSize ?? "")}
            error={fieldErrors.clothingSize?.[0]}
          />
          <SelectField
            label="視力（矯正）"
            name="visionCorrection"
            defaultValue={val("visionCorrection", candidate?.visionCorrection ?? "")}
            options={VISION_CORRECTION_LABELS}
            optional
            error={fieldErrors.visionCorrection?.[0]}
          />
          <Field
            label="視力 右"
            name="visionRight"
            type="number"
            step="0.1"
            min={0}
            max={3}
            placeholder="例: 1.0"
            defaultValue={val("visionRight", candidate?.visionRight?.toString() ?? "")}
            error={fieldErrors.visionRight?.[0]}
          />
          <Field
            label="視力 左"
            name="visionLeft"
            type="number"
            step="0.1"
            min={0}
            max={3}
            placeholder="例: 1.0"
            defaultValue={val("visionLeft", candidate?.visionLeft?.toString() ?? "")}
            error={fieldErrors.visionLeft?.[0]}
          />

          <YesNoDetailFieldInteractive
            label="通院中の病気・ケガ"
            name="hasMedicalTreatment"
            detailName="medicalTreatmentDetail"
            value={hasMedical}
            detailValue={val(
              "medicalTreatmentDetail",
              candidate?.medicalTreatmentDetail ?? ""
            )}
            onValueChange={setHasMedical}
            detailLabel="詳細"
            detailPlaceholder="通院中の内容を記入"
            error={fieldErrors.hasMedicalTreatment?.[0]}
            detailError={fieldErrors.medicalTreatmentDetail?.[0]}
          />

          <YesNoDetailFieldInteractive
            label="身体障害・精神障害"
            name="hasDisability"
            detailName="disabilityDetail"
            value={hasDisability}
            detailValue={val("disabilityDetail", candidate?.disabilityDetail ?? "")}
            onValueChange={setHasDisability}
            detailLabel="詳細"
            detailPlaceholder="障害の内容・配慮事項を記入"
            error={fieldErrors.hasDisability?.[0]}
            detailError={fieldErrors.disabilityDetail?.[0]}
          />

          <YesNoDetailFieldInteractive
            label="タトゥー"
            name="hasTattoo"
            detailName="tattooDetail"
            value={hasTattoo}
            detailValue={val("tattooDetail", candidate?.tattooDetail ?? "")}
            onValueChange={setHasTattoo}
            detailLabel="詳細"
            detailPlaceholder="部位・サイズなど"
            error={fieldErrors.hasTattoo?.[0]}
            detailError={fieldErrors.tattooDetail?.[0]}
          />
        </div>
      </FormSection>

      <FormSection title="その他">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="国籍"
            name="nationality"
            defaultValue={val("nationality", candidate?.nationality ?? "")}
            error={fieldErrors.nationality?.[0]}
          />
          <SelectField
            label="在留資格"
            name="visaStatus"
            defaultValue={val("visaStatus", candidate?.visaStatus ?? "")}
            options={VISA_STATUS_LABELS}
            optional
            error={fieldErrors.visaStatus?.[0]}
          />
          <div className="space-y-2 sm:col-span-2">
            <Label>保有資格</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {QUALIFICATION_OPTIONS.map((q) => (
                <label key={q.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="qualifications"
                    value={q.key}
                    defaultChecked={initialQualifications.includes(q.key)}
                    className="h-4 w-4 rounded border-input"
                  />
                  {q.label}
                </label>
              ))}
            </div>
          </div>
          <TextField
            label="ヒアリングメモ"
            name="hearingMemo"
            defaultValue={val("hearingMemo", candidate?.hearingMemo ?? "")}
            className="sm:col-span-2"
            rows={4}
            error={fieldErrors.hearingMemo?.[0]}
          />
        </div>
      </FormSection>

      {state.success && mode === "edit" && (
        <p className="text-sm text-green-600">保存しました</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : mode === "create" ? CANDIDATE_DISPLAY.registerButton : "変更を保存"}
        </Button>
      </div>
    </form>
  );
}

function yesNoToSelect(value?: boolean | null): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

const FIELD_LABELS: Record<string, string> = {
  fullName: "氏名",
  lastName: "氏名",
  firstName: "氏名",
  furigana: "フリガナ",
  phone: "電話番号",
  email: "メールアドレス",
  birthDate: "生年月日",
  age: "年齢",
  postalCode: "郵便番号",
  addressLine: "住所",
  source: "流入経路",
  tattooDetail: "タトゥー詳細",
  medicalTreatmentDetail: "通院詳細",
  disabilityDetail: "障害詳細",
};

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  value,
  onChange,
  onBlur,
  type = "text",
  required,
  readOnly,
  error,
  className,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  error?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const controlled = value !== undefined;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        {...(controlled ? { value, onChange, onBlur } : { defaultValue, onBlur })}
        required={required}
        readOnly={readOnly}
        aria-invalid={Boolean(error)}
        className={cn(error && inputErrorClass)}
        {...props}
      />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  className,
  rows = 3,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  className?: string;
  rows?: number;
  error?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <Textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(error && inputErrorClass)}
      />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  optional,
  className,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: Record<string, string>;
  optional?: boolean;
  className?: string;
  error?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={Boolean(error)}
        className={cn(selectClass, error && selectErrorClass)}
      >
        {optional && <option value="">未選択</option>}
        {Object.entries(options).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

function BoolSelect({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={Boolean(error)}
        className={cn(selectClass, error && selectErrorClass)}
      >
        <option value="">未選択</option>
        <option value="true">可</option>
        <option value="false">不可</option>
      </select>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

function YesNoExperienceSelect({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={Boolean(error)}
        className={cn(selectClass, error && selectErrorClass)}
      >
        <option value="">未選択</option>
        <option value="true">有り</option>
        <option value="false">無し</option>
      </select>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

function YesNoOkNgSelect({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={Boolean(error)}
        className={cn(selectClass, error && selectErrorClass)}
      >
        <option value="">未選択</option>
        <option value="true">OK</option>
        <option value="false">NG</option>
      </select>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
