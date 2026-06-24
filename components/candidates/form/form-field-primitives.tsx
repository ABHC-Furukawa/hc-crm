"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const selectErrorClass =
  "border-destructive bg-destructive/5 ring-1 ring-destructive focus-visible:ring-destructive";

const inputErrorClass = "border-destructive bg-destructive/5 ring-1 ring-destructive";

export function YesNoDetailField({
  label,
  name,
  detailName,
  defaultValue,
  detailDefaultValue,
  detailLabel,
  detailPlaceholder,
  error,
  detailError,
}: {
  label: string;
  name: string;
  detailName: string;
  defaultValue?: string;
  detailDefaultValue?: string;
  detailLabel: string;
  detailPlaceholder?: string;
  error?: string;
  detailError?: string;
}) {
  const showDetail = defaultValue === "true";

  return (
    <div className="space-y-3 sm:col-span-2">
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
          <option value="false">なし</option>
          <option value="true">あり</option>
        </select>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>

      {showDetail && (
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <Label htmlFor={detailName} className={cn(detailError && "text-destructive")}>
            {detailLabel}
          </Label>
          <Textarea
            id={detailName}
            name={detailName}
            defaultValue={detailDefaultValue}
            rows={3}
            placeholder={detailPlaceholder}
            aria-invalid={Boolean(detailError)}
            className={cn(detailError && inputErrorClass)}
          />
          {detailError && (
            <p className="text-sm font-medium text-destructive">{detailError}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Client-side toggle for yes/no detail — use inside controlled form sections */
export function YesNoDetailFieldInteractive({
  label,
  name,
  detailName,
  value,
  detailValue,
  onValueChange,
  detailLabel,
  detailPlaceholder,
  error,
  detailError,
}: {
  label: string;
  name: string;
  detailName: string;
  value: string;
  detailValue: string;
  onValueChange: (value: string) => void;
  detailLabel: string;
  detailPlaceholder?: string;
  error?: string;
  detailError?: string;
}) {
  const showDetail = value === "true";

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="space-y-2">
        <Label htmlFor={name} className={cn(error && "text-destructive")}>
          {label}
        </Label>
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(selectClass, error && selectErrorClass)}
        >
          <option value="">未選択</option>
          <option value="false">なし</option>
          <option value="true">あり</option>
        </select>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>

      {showDetail && (
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <Label htmlFor={detailName} className={cn(detailError && "text-destructive")}>
            {detailLabel}
          </Label>
          <Textarea
            id={detailName}
            name={detailName}
            defaultValue={detailValue}
            rows={3}
            placeholder={detailPlaceholder}
            aria-invalid={Boolean(detailError)}
            className={cn(detailError && inputErrorClass)}
          />
          {detailError && (
            <p className="text-sm font-medium text-destructive">{detailError}</p>
          )}
        </div>
      )}
    </div>
  );
}

export { selectClass, selectErrorClass, inputErrorClass };
