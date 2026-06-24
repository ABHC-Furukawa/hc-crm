"use client";

import { useState } from "react";
import type {
  CallStatus,
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
} from "@prisma/client";
import { COMMUNICATION_CHANNELS_MANUAL } from "@/lib/validators/communication";
import {
  CALL_STATUS_LABELS,
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_DIRECTION_LABELS,
} from "@/lib/constants/labels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CommunicationFormDefaults = {
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject: string;
  body: string;
  status: CommunicationStatus;
  occurredAt: string;
  callStatus?: CallStatus;
  durationSeconds?: string;
};

export function CommunicationLogFormFields({
  defaultValues,
}: {
  defaultValues?: Partial<CommunicationFormDefaults>;
}) {
  const [channel, setChannel] = useState<CommunicationChannel>(
    defaultValues?.channel ?? "MEETING"
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="channel">チャネル</Label>
        <select
          id="channel"
          name="channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value as CommunicationChannel)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          {COMMUNICATION_CHANNELS_MANUAL.map((ch) => (
            <option key={ch} value={ch}>
              {COMMUNICATION_CHANNEL_LABELS[ch]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="direction">方向</Label>
        <select
          id="direction"
          name="direction"
          defaultValue={defaultValues?.direction ?? "OUTBOUND"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          {Object.entries(COMMUNICATION_DIRECTION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="subject">件名</Label>
        <Input id="subject" name="subject" placeholder="任意" defaultValue={defaultValues?.subject} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="body">内容</Label>
        <Textarea
          id="body"
          name="body"
          rows={3}
          placeholder="連絡内容..."
          defaultValue={defaultValues?.body}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="occurredAt">日時</Label>
        <Input
          id="occurredAt"
          name="occurredAt"
          type="datetime-local"
          defaultValue={defaultValues?.occurredAt}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">ステータス</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "SENT"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="SENT">送信済</option>
          <option value="DELIVERED">配信済</option>
          <option value="READ">既読</option>
        </select>
      </div>

      {channel === "CALL" && (
        <>
          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium text-primary">通話情報（Call テーブル）</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="callStatus">通話結果</Label>
            <select
              id="callStatus"
              name="callStatus"
              defaultValue={defaultValues?.callStatus ?? "COMPLETED"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {Object.entries(CALL_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationSeconds">通話時間（秒）</Label>
            <Input
              id="durationSeconds"
              name="durationSeconds"
              type="number"
              min={0}
              placeholder="180"
              defaultValue={defaultValues?.durationSeconds}
            />
          </div>
        </>
      )}
    </div>
  );
}
