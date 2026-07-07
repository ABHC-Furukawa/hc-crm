"use client";

import { cn } from "@/lib/utils";

export const RESUME_FORM_SECTIONS = [
  { id: "resume-basic", label: "基本情報" },
  { id: "resume-photo", label: "証明写真" },
  { id: "resume-education", label: "学歴" },
  { id: "resume-work", label: "職歴" },
  { id: "resume-licenses", label: "資格" },
  { id: "resume-pr", label: "自己PR" },
] as const;

export function ResumeSectionNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex gap-2 overflow-x-auto rounded-lg border bg-card p-2 text-sm",
        className
      )}
      aria-label="履歴書セクション"
    >
      {RESUME_FORM_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="shrink-0 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
