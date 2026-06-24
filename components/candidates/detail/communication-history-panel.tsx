"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { CandidateDetail } from "@/types/candidate";
import { createCommunicationLogAction } from "@/lib/actions/communications";
import { COMMUNICATION_CHANNELS_MANUAL } from "@/lib/validators/communication";
import { COMMUNICATION_CHANNEL_LABELS } from "@/lib/constants/labels";
import { CommunicationItem } from "@/components/candidates/detail/communication-item";
import { CommunicationLogFormFields } from "@/components/candidates/detail/communication-log-form-fields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommunicationChannel } from "@prisma/client";

export function CommunicationHistoryPanel({ candidate }: { candidate: CandidateDetail }) {
  const [channelFilter, setChannelFilter] = useState<CommunicationChannel | "ALL">("ALL");
  const [state, formAction, pending] = useActionState(
    createCommunicationLogAction.bind(null, candidate.id),
    {}
  );

  const filtered = useMemo(() => {
    if (channelFilter === "ALL") return candidate.communications;
    return candidate.communications.filter((c) => c.channel === channelFilter);
  }, [candidate.communications, channelFilter]);

  const channelCounts = useMemo(() => {
    const counts: Partial<Record<CommunicationChannel, number>> = {};
    for (const c of candidate.communications) {
      counts[c.channel] = (counts[c.channel] ?? 0) + 1;
    }
    return counts;
  }, [candidate.communications]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>連絡を記録</CardTitle>
          <p className="text-sm text-muted-foreground">
            手動記録。CALL 選択時は Communication + Call テーブルに保存（PBX Webhook と同構造）
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <CommunicationLogFormFields />
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "記録中..." : "連絡を記録"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>連絡履歴 ({filtered.length})</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                active={channelFilter === "ALL"}
                onClick={() => setChannelFilter("ALL")}
                label={`すべて (${candidate.communications.length})`}
              />
              {COMMUNICATION_CHANNELS_MANUAL.map((ch) => (
                <FilterChip
                  key={ch}
                  active={channelFilter === ch}
                  onClick={() => setChannelFilter(ch)}
                  label={`${COMMUNICATION_CHANNEL_LABELS[ch]} (${channelCounts[ch] ?? 0})`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              連絡履歴がありません。「連絡を記録」から追加できます。
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((comm) => (
                <CommunicationItem
                  key={comm.id}
                  communication={comm}
                  candidateId={candidate.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button type="button" onClick={onClick}>
      <Badge variant={active ? "default" : "outline"} className="cursor-pointer">
        {label}
      </Badge>
    </button>
  );
}
