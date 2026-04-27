"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toDate } from "@/lib/utils";

interface TicketMessage {
  senderId: string;
  senderName: string;
  text: string;
  sentAt: unknown;
  isAdmin: boolean;
}

interface TicketThreadProps {
  ticketId: string;
  messages: TicketMessage[];
  onSent?: () => void;
}

export function TicketThread({ ticketId, messages, onSent }: TicketThreadProps) {
  const [message, setMessage] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/crm/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          message: message.trim(),
          sendPush,
          sendInApp,
        }),
      });
      setMessage("");
      onSent?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((msg, index) => {
          const sentAt = toDate(msg.sentAt) ?? new Date();
          return (
            <div
              key={`${msg.senderId}-${index}`}
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.isAdmin
                  ? "ml-auto bg-accent/25 text-foreground"
                  : "mr-auto bg-surface text-foreground"
              }`}
            >
              <div className="mb-1 text-xs text-muted">{msg.senderName}</div>
              <div>{msg.text}</div>
              <div className="mt-1 text-[11px] text-muted">{format(sentAt, "dd MMM, hh:mm a")}</div>
            </div>
          );
        })}
      </div>
      <div className="space-y-3 border-t border-border p-3">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Reply to ticket..."
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-xs text-muted">
            <Input
              type="checkbox"
              checked={sendPush}
              onChange={(event) => setSendPush(event.target.checked)}
              className="h-4 w-4"
            />
            Send as Push Notification
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            <Input
              type="checkbox"
              checked={sendInApp}
              onChange={(event) => setSendInApp(event.target.checked)}
              className="h-4 w-4"
            />
            Send as In-App Message
          </label>
        </div>
        <Button onClick={submit} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
