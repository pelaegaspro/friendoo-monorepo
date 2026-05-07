"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase"; // Assuming this path for firebase config
import {
  collection, doc, onSnapshot, addDoc, updateDoc,
  serverTimestamp, orderBy, query, Timestamp
} from "firebase/firestore";

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
  createdAt?: Timestamp;
  deliveredAt?: Timestamp | null;
  readAt?: Timestamp | null;
  [key: string]: unknown;
};

export default function ReportThread({ reportId }: { reportId: string }) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. REAL-TIME DATA SYNC
  useEffect(() => {
    const unsubReport = onSnapshot(doc(db, "reports", reportId), snap => {
      setReport({ id: snap.id, ...snap.data() });
    });

    const q = query(
      collection(db, "reports", reportId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubMessages = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => { unsubReport(); unsubMessages(); };
  }, [reportId]);

  // 2. ADMIN ACTIONS
  async function sendReply() {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, "reports", reportId, "messages"), {
        text: replyText.trim(),
        senderType: "admin",
        createdAt: serverTimestamp(),
        deliveredAt: null,
        readAt: null
      });

      if (report && report.status === "pending") {
        await updateDoc(doc(db, "reports", reportId), { status: "under_review" });
      }
      setReplyText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h2 className="text-lg font-bold capitalize">{report?.reason?.replace(/_/g, " ")}</h2>
          <p className="text-xs text-gray-500">Report #{reportId.slice(0, 8)}</p>
        </div>
        <StatusDropdown reportId={reportId} currentStatus={report?.status} />
      </div>

      {/* Evidence */}
      {report?.evidenceUrl && (
        <div className="p-4 border-b bg-yellow-50">
           <span className="text-xs font-bold text-yellow-800 uppercase">Evidence Provided:</span>
           <div className="mt-2">
              <a href={report.evidenceUrl} target="_blank" rel="noreferrer">
                <img src={report.evidenceUrl} alt="evidence" className="h-20 w-20 object-cover rounded border" />
              </a>
           </div>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply Area */}
      {["resolved", "rejected"].includes(report?.status ?? "") ? (
        <div className="p-4 bg-gray-100 text-center text-sm font-medium text-gray-600">
          This report is closed. Reopen it to send more replies.
        </div>
      ) : (
        <div className="p-4 border-t bg-white">
          <QuickReplies onSelect={setReplyText} />
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Type your reply to the user..."
            className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
            onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                }
            }}
          />
          <div className="flex items-center justify-between mt-3">
            <ActionButtons reportId={reportId} report={report} />
            <button
              onClick={sendReply}
              disabled={sending || !replyText.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Reply ↵"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDropdown({ reportId, currentStatus }: { reportId: string; currentStatus?: string }) {
  async function changeStatus(newStatus: string) {
    await updateDoc(doc(db, "reports", reportId), {
      status: newStatus,
      resolvedAt: ["resolved", "rejected"].includes(newStatus) ? serverTimestamp() : null
    });
  }
  const options = [
    { value: "pending", label: "⏳ Pending", color: "text-orange-600" },
    { value: "under_review", label: "🔍 Under Review", color: "text-blue-600" },
    { value: "resolved", label: "✅ Resolved", color: "text-green-600" },
    { value: "rejected", label: "❌ Closed", color: "text-red-600" }
  ];
  return (
    <select
      value={currentStatus}
      onChange={e => changeStatus(e.target.value)}
      className="p-2 border rounded-lg text-sm font-medium bg-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function QuickReplies({ onSelect }: { onSelect: (text: string) => void }) {
  const templates = [
    "We have reviewed your report and taken action against the host.",
    "Can you share a screenshot of the GPay/PhonePe payment proof?",
    "We are investigating this and will update you within 24 hours.",
    "The host has been permanently removed for policy violations.",
    "Report closed: We could not find a violation in this instance."
  ];
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {templates.map((t, i) => (
        <button key={i} onClick={() => onSelect(t)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[10px] rounded-full text-gray-700 border transition-colors">
          {t.slice(0, 30)}...
        </button>
      ))}
    </div>
  );
}

function ActionButtons({ reportId, report }: { reportId: string; report: ReportData | null }) {
  const freezeHost = async () => {
    if (!report?.reportedId) return;
    await updateDoc(doc(db, "hosts", report.reportedId), {
      payoutFrozen: true, isOnline: false, callStatus: "offline", freezeReason: "admin_manual"
    });
    alert("Host frozen ✅");
  };

  const banHost = async () => {
    if (!report?.reportedId) return;
    await updateDoc(doc(db, "hosts", report.reportedId), { status: "banned" });
    await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
    alert("Host banned ✅");
  };

  return (
    <div className="flex gap-2">
      <button onClick={freezeHost} className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded hover:bg-yellow-200">🧊 Freeze Host</button>
      <button onClick={banHost} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded hover:bg-red-200">🚫 Ban Host</button>
    </div>
  );
}

function MessageBubble({ message }: { message: MessageData }) {
  const isAdmin = message.senderType === "admin";
  const time = message.createdAt?.toDate()?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) || "";
  
  return (
    <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${isAdmin ? "bg-blue-600 text-white rounded-br-none" : "bg-white border rounded-bl-none"}`}>
        <p className="text-[10px] font-bold mb-1 opacity-70">{isAdmin ? "You (Admin)" : "User"}</p>
        <p className="text-sm">{message.text}</p>
        <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
          <span className="text-[9px]">{time}</span>
          {isAdmin && (
            <span className="text-[9px]">
               {message.readAt ? "✓✓ Read" : message.deliveredAt ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
