import type { CommunicationListItem } from "@/lib/communications/queries";
import { CommunicationItem } from "@/components/candidates/detail/communication-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CommunicationList({
  communications,
}: {
  communications: CommunicationListItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>連絡履歴 ({communications.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {communications.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            条件に一致する連絡履歴がありません。フィルタを変更するか、手動記録を追加してください。
          </p>
        ) : (
          <div className="space-y-4">
            {communications.map((comm) => (
              <CommunicationItem
                key={comm.id}
                communication={comm}
                candidateId={comm.candidateId}
                showCandidateLink
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
