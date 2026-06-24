"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Mail, RotateCcw, Trash2 } from "lucide-react";
import {
  deleteUserAction,
  reactivateUserAction,
  resendInviteAction,
  suspendUserAction,
} from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserStatusActionsProps = {
  userId: string;
  email: string;
  isActive: boolean;
  pendingInvite: boolean;
  isSelf: boolean;
};

export function UserStatusActions({
  userId,
  email,
  isActive,
  pendingInvite,
  isSelf,
}: UserStatusActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  function runAction(action: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {pendingInvite ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => runAction(() => resendInviteAction(userId))}
          >
            <Mail className="mr-1 h-3.5 w-3.5" />
            再招待
          </Button>
        ) : isActive ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (
                !window.confirm(
                  `${email} を停止しますか？\nログインできなくなります。`
                )
              ) {
                return;
              }
              runAction(() => suspendUserAction(userId));
            }}
          >
            <Ban className="mr-1 h-3.5 w-3.5" />
            停止
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => runAction(() => reactivateUserAction(userId))}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            再開
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            setError(null);
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          削除
        </Button>
      </div>

      {error && !deleteOpen && (
        <p className="max-w-xs text-xs text-destructive">{error}</p>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>アカウントを削除</DialogTitle>
            <DialogDescription>
              {email} を CRM と Supabase から完全に削除します。
              履歴データ（メモ・架電・ファイル等）がある場合は削除できません。
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setDeleteOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => runAction(() => deleteUserAction(userId))}
            >
              {pending ? "削除中…" : "削除する"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
