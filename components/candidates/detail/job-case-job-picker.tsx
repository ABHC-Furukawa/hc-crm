"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Search, X } from "lucide-react";
import {
  getJobCaseDefaultsFromJob,
  searchJobsForCaseLink,
} from "@/lib/actions/job-case-link";
import {
  formatJobPickerLabel,
  type JobPickerItem,
} from "@/lib/jobs/job-case-bridge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type JobCaseLinkSelection = {
  jobId: string;
  entryJobName: string;
  dispatchCompanyKey: string;
  dispatchCompanyOther: string;
  referralFee: string;
};

export function JobCaseJobPicker({
  disabled,
  initialJob,
  onSelect,
}: {
  disabled?: boolean;
  initialJob?: JobPickerItem | null;
  onSelect: (selection: JobCaseLinkSelection | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JobPickerItem[]>([]);
  const [selected, setSelected] = useState<JobPickerItem | null>(initialJob ?? null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || query.trim().length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const items = await searchJobsForCaseLink(query);
        setResults(items);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  async function handleSelect(job: JobPickerItem) {
    setSelected(job);
    setOpen(false);
    setQuery("");

    const defaults = await getJobCaseDefaultsFromJob(job.id);
    if (!defaults) return;

    onSelect({
      jobId: defaults.jobId,
      entryJobName: defaults.entryJobName,
      dispatchCompanyKey: defaults.dispatchCompanyKey,
      dispatchCompanyOther: defaults.dispatchCompanyOther ?? "",
      referralFee: defaults.referralFee?.toString() ?? "",
    });
  }

  function clear() {
    setSelected(null);
    onSelect(null);
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>ATS 案件から選択</Label>
      {selected ? (
        <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="font-medium">{formatJobPickerLabel(selected)}</p>
            {selected.referralFee && (
              <p className="text-muted-foreground">紹介料: {selected.referralFee}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/jobs/${selected.id}`} target="_blank">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                案件詳細
              </Link>
            </Button>
            {!disabled && (
              <Button type="button" variant="ghost" size="sm" onClick={clear}>
                <X className="h-4 w-4" />
                <span className="sr-only">選択解除</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        !disabled && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setOpen(false), 150);
                }}
                placeholder="派遣先企業名・派遣会社名で検索..."
                className="pl-9"
              />
            </div>
            {open && (pending || results.length > 0) && (
              <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                {pending && results.length === 0 && (
                  <li className="px-3 py-2 text-sm text-muted-foreground">検索中...</li>
                )}
                {results.map((job) => (
                  <li key={job.id}>
                    <button
                      type="button"
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(job)}
                    >
                      <span className="font-medium">{job.jobTitle}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {job.companyName}
                        {job.location ? ` · ${job.location}` : ""}
                        {job.referralFee ? ` · ${job.referralFee}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      )}
      <input type="hidden" name="jobId" value={selected?.id ?? ""} />
    </div>
  );
}
