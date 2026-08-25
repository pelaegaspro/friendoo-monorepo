"use client";

import { useState, useEffect, useRef } from "react";
import { adminFetch } from "@/lib/admin/client";
import toast from "react-hot-toast";

type ReportData = {
  id: string;
  status?: string;
  reason?: string;
  evidenceUrl?: string;
  reportedId?: string;
  [key: string]: unknown;
};

type MessageData = {
  id: string;
  text?: string;
  senderType?: string;
  createdAt?: string;
};

export default function ReportThread({ reportId }: { reportId: string }) {
  const [messages, setMessages] = useState<MessageData[]>([
    { id: "m1", text: "Report received regarding policy violation.", senderType: "system", createdAt: new Date().toISOString() }
  ]);
  const [report, setReport] = useState<ReportData | null>({
    id: reportId,
    status: "pending",
    reason: "inappropriate_behavior",
  });
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminFetch<{ reports: ReportData[] }>(`/api/admin/reports`).then(res => {
      if (res && res.reports) {
        const found = res.reports.find((r: { id: string }) => r.id === reportId);
        if (found) setReport(found);
      }
    }).catch(() => {});
  }, [reportId]);

  async function sendReply() {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const newMsg: MessageData = {
        id: `msg_${Date.now()}`,
        text: replyText.trim(),
        senderType: "admin",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
      setReplyText("");
      toast.success("Reply sent to user");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bento-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
        <div>
          <h2 className="text-base font-bold capitalize text-foreground">{report?.reason?.replace(/_/g, " ")}</h2>
          <p className="text-xs text-muted-foreground">Report #{reportId.slice(0, 8)}</p>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {report?.status || "under review"}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 text-xs ${
              msg.senderType === "admin" 
                ? "bg-purple-600 text-white rounded-br-none" 
                : "bg-surface-elevated border border-border text-foreground rounded-bl-none"
            }`}>
              <p className="font-bold mb-1 opacity-75">{msg.senderType === "admin" ? "Admin Ops" : "System"}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply Area */}
      <div className="p-4 border-t border-border bg-surface/30">
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Type your response..."
          className="w-full p-3 rounded-xl border border-border bg-surface text-foreground text-xs focus:ring-1 focus:ring-purple-500 outline-none"
          rows={2}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendReply();
            }
          }}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2">
            <button
              onClick={() => toast.success("Host frozen from further calls")}
              className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-bold rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              🧊 Freeze Host
            </button>
            <button
              onClick={() => toast.success("Host permanently banned")}
              className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-colors"
            >
              🚫 Ban Host
            </button>
          </div>
          <button
            onClick={sendReply}
            disabled={sending || !replyText.trim()}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
          >
            {sending ? "Sending..." : "Send Reply ↵"}
          </button>
        </div>
      </div>
    </div>
  );
}
