"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { CandidateDetail } from "@/types/candidate";
import {
  createTaskAction,
  updateTaskAction,
  updateTaskAssigneeAction,
  updateTaskStatusAction,
} from "@/lib/actions/tasks";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants/labels";
import { toDateInputValue } from "@/lib/validators/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@prisma/client";

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const OPEN_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS"];

type AssignableUser = { id: string; name: string };

export function TaskListPanel({
  candidate,
  assignableUsers,
}: {
  candidate: CandidateDetail;
  assignableUsers: AssignableUser[];
}) {
  const [state, formAction, pending] = useActionState(
    createTaskAction.bind(null, candidate.id),
    {}
  );

  const openTasks = candidate.tasks.filter((t) => OPEN_STATUSES.includes(t.status));
  const doneTasks = candidate.tasks.filter((t) => !OPEN_STATUSES.includes(t.status));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>タスクを追加</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">タイトル</Label>
              <Input id="title" name="title" required placeholder="例: 面接日程の調整" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">詳細</Label>
              <Input id="description" name="description" placeholder="任意" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">優先度</Label>
              <select
                id="priority"
                name="priority"
                defaultValue="MEDIUM"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueAt">期限</Label>
              <Input id="dueAt" name="dueAt" type="date" />
            </div>
            {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "追加中..." : "タスクを追加"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <TaskSection
        title={`未完了 (${openTasks.length})`}
        tasks={openTasks}
        candidateId={candidate.id}
        assignableUsers={assignableUsers}
      />
      {doneTasks.length > 0 && (
        <TaskSection
          title={`完了・キャンセル (${doneTasks.length})`}
          tasks={doneTasks}
          candidateId={candidate.id}
          assignableUsers={assignableUsers}
          muted
        />
      )}
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  candidateId,
  assignableUsers,
  muted,
}: {
  title: string;
  tasks: CandidateDetail["tasks"];
  candidateId: string;
  assignableUsers: AssignableUser[];
  muted?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">タスクなし</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                candidateId={candidateId}
                assignableUsers={assignableUsers}
                muted={muted}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TaskItem({
  task,
  candidateId,
  assignableUsers,
  muted,
}: {
  task: CandidateDetail["tasks"][number];
  candidateId: string;
  assignableUsers: AssignableUser[];
  muted?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const isOpen = OPEN_STATUSES.includes(task.status);

  if (editing) {
    return (
      <li className="rounded-lg border p-3">
        <TaskEditForm
          task={task}
          candidateId={candidateId}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </li>
    );
  }

  return (
    <li className={`rounded-lg border p-3 ${muted ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{task.title}</span>
              <Badge variant="outline" className={PRIORITY_STYLE[task.priority]}>
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
              <Badge variant="secondary">{TASK_STATUS_LABELS[task.status]}</Badge>
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              担当: {task.assignedTo?.name ?? "—"}
              {task.dueAt && ` · 期限: ${formatDate(task.dueAt)}`}
              {task.completedAt && ` · 完了: ${formatDateTime(task.completedAt)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOpen && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-3 w-3" />
                編集
              </Button>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-end sm:justify-between">
            <form
              action={updateTaskAssigneeAction.bind(null, task.id, candidateId)}
              className="flex flex-wrap items-end gap-2"
            >
              <div className="space-y-1">
                <Label htmlFor={`assignee-${task.id}`} className="text-xs">
                  担当者
                </Label>
                <select
                  id={`assignee-${task.id}`}
                  name="assignedToId"
                  defaultValue={task.assignedToId ?? ""}
                  className="flex h-8 min-w-[140px] rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm" variant="outline">
                担当変更
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {task.status === "TODO" && (
                <StatusButton taskId={task.id} candidateId={candidateId} status="IN_PROGRESS" label="着手" />
              )}
              {task.status === "IN_PROGRESS" && (
                <StatusButton taskId={task.id} candidateId={candidateId} status="TODO" label="未着手に戻す" />
              )}
              <StatusButton taskId={task.id} candidateId={candidateId} status="DONE" label="完了" />
              <StatusButton
                taskId={task.id}
                candidateId={candidateId}
                status="CANCELLED"
                label="キャンセル"
                variant="ghost"
              />
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function StatusButton({
  taskId,
  candidateId,
  status,
  label,
  variant = "outline",
}: {
  taskId: string;
  candidateId: string;
  status: TaskStatus;
  label: string;
  variant?: "outline" | "ghost";
}) {
  return (
    <form action={updateTaskStatusAction.bind(null, taskId, candidateId)}>
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

function TaskEditForm({
  task,
  candidateId,
  onCancel,
  onSaved,
}: {
  task: CandidateDetail["tasks"][number];
  candidateId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateTaskAction.bind(null, task.id, candidateId),
    {}
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onSaved();
    }
    wasPending.current = pending;
  }, [pending, state.error, onSaved]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`edit-title-${task.id}`}>タイトル</Label>
        <Input id={`edit-title-${task.id}`} name="title" required defaultValue={task.title} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`edit-description-${task.id}`}>詳細</Label>
        <Input
          id={`edit-description-${task.id}`}
          name="description"
          defaultValue={task.description ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`edit-priority-${task.id}`}>優先度</Label>
        <select
          id={`edit-priority-${task.id}`}
          name="priority"
          defaultValue={task.priority}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`edit-dueAt-${task.id}`}>期限</Label>
        <Input
          id={`edit-dueAt-${task.id}`}
          name="dueAt"
          type="date"
          defaultValue={toDateInputValue(task.dueAt)}
        />
      </div>
      {state.error && <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : "保存"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
