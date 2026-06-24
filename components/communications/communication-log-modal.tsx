"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createCommunicationFromGlobalAction } from "@/lib/actions/communications";
import { CommunicationLogFormFields } from "@/components/candidates/detail/communication-log-form-fields";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { fullName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type CandidateOption = {
  id: string;
  lastName: string;
  firstName: string;
};

export function CommunicationLogModal({
  candidates,
}: {
  candidates: CandidateOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? "");

  const [state, formAction, pending] = useActionState(createCommunicationFromGlobalAction, {});
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setOpen(false);
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state.error, router]);

  useEffect(() => {
    if (!candidateId && candidates[0]) {
      setCandidateId(candidates[0].id);
    }
  }, [candidateId, candidates]);

  if (candidates.length === 0) {
    return (
      <Button disabled>
        <Plus className="mr-2 h-4 w-4" />
        連絡を記録
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          連絡を記録
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>連絡を記録</DialogTitle>
          <DialogDescription>
            {CANDIDATE_DISPLAY.logModalHint}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="log-candidate">{CANDIDATE_DISPLAY.name}</Label>
            <select
              id="log-candidate"
              name="candidateId"
              required
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c.lastName, c.firstName)}
                </option>
              ))}
            </select>
          </div>

          <CommunicationLogFormFields />

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={pending || !candidateId}>
              {pending ? "記録中..." : "連絡を記録"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
