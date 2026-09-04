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

  async function handleBan() {
    if (!report?.reportedId) {
      toast.error("No reported user ID found on this report");
      return;
    }
    if (!confirm("Are you sure you want to ban the reported user?")) return;
    try {
      await adminFetch(`/api/admin/reports/${reportId}`, {
        method: "POST",
        body: JSON.stringify({ action: "ban", reportedId: report.reportedId }),
      });
      toast.success("User banned and report resolved");
      setReport(prev => prev ? { ...prev, status: "resolved" } : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ban user");
    }
  }

  async function handleDismiss() {
    try {
      await adminFetch(`/api/admin/reports/${reportId}`, {
        method: "POST",
        body: JSON.stringify({ action: "dismiss", reportedId: report?.reportedId }),
      });
      toast.success("Report marked resolved");
      setReport(prev => prev ? { ...prev, status: "resolved" } : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve report");
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-xs rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 transition-colors"
          >
            Mark Resolved
          </button>
          <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {report?.status || "under review"}
          </div>
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
          placeholder="Type notes or message..."
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
              onClick={handleBan}
              className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-colors"
            >
              🚫 Ban Reported User
            </button>
          </div>
          <button
            onClick={sendReply}
            disabled={sending || !replyText.trim()}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
          >
            {sending ? "Saving..." : "Add Note / Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}
