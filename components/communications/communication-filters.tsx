import Link from "next/link";
import { COMMUNICATION_CHANNEL_LABELS } from "@/lib/constants/labels";
import type { CommunicationFilters } from "@/lib/communications/filters";
import { COMMUNICATION_CHANNELS_MANUAL } from "@/lib/validators/communication";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { fullName } from "@/lib/utils";
import { formatUserSurname } from "@/lib/users/display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasActiveCommunicationFilters } from "@/lib/communications/filters";

type FilterOption = {
  candidates: Array<{ id: string; lastName: string; firstName: string }>;
  advisors: Array<{ id: string; name: string; lastName: string }>;
};

export function CommunicationFilters({
  filters,
  options,
}: {
  filters: CommunicationFilters;
  options: FilterOption;
}) {
  const hasFilters = hasActiveCommunicationFilters(filters);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">フィルタ</CardTitle>
      </CardHeader>
      <CardContent>
        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="channel">チャネル</Label>
            <select
              id="channel"
              name="channel"
              defaultValue={filters.channel ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">すべて</option>
              {COMMUNICATION_CHANNELS_MANUAL.map((ch) => (
                <option key={ch} value={ch}>
                  {COMMUNICATION_CHANNEL_LABELS[ch]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from">期間（開始）</Label>
            <Input id="from" name="from" type="date" defaultValue={filters.from ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">期間（終了）</Label>
            <Input id="to" name="to" type="date" defaultValue={filters.to ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidateId">{CANDIDATE_DISPLAY.name}</Label>
            <select
              id="candidateId"
              name="candidateId"
              defaultValue={filters.candidateId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">すべて</option>
              {options.candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c.lastName, c.firstName)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advisorId">担当CA</Label>
            <select
              id="advisorId"
              name="advisorId"
              defaultValue={filters.advisorId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">すべて</option>
              {options.advisors.map((a) => (
                <option key={a.id} value={a.id}>
                  {formatUserSurname(a)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-5">
            <Button type="submit">絞り込む</Button>
            {hasFilters && (
              <Button type="button" variant="outline" asChild>
                <Link href="/communications">クリア</Link>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
