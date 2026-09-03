"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TicketThread } from "@/components/crm/TicketThread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDate, toNumber } from "@/lib/utils";

interface TicketDetail {
  id: string;
  userId?: string;
  hostId?: string;
  type?: "user_complaint" | "host_complaint" | "refund_request" | "general";
  subject?: string;
  description?: string;
  status?: "open" | "in_progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  internalNotes?: string;
  refundAmount?: number;
  messages?: Array<{
    senderId: string;
    senderName: string;
    text: string;
    sentAt: unknown;
    isAdmin: boolean;
  }>;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export default function TicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/crm/support/tickets/${params.ticketId}`, { cache: "no-store" });
    const json = await response.json();
    const found = json.ticket as TicketDetail;
    setTicket(found);
    setStatus(found.status || "open");
    setPriority(found.priority || "medium");
    setAssignedTo(found.assignedTo || "");
    setInternalNotes(found.internalNotes || "");
    setLoading(false);
  }, [params.ticketId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const saveMeta = async () => {
    await fetch("/api/crm/support/tickets/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: params.ticketId,
        status,
        priority,
        assignedTo,
        internalNotes,
      }),
    });
    await load();
  };

  const processRefund = async () => {
    if (!ticket?.userId) return;
    const amountRaw = window.prompt("Coins to refund", String(ticket.refundAmount || 20));
    if (!amountRaw) return;
    const coinsAmount = Math.max(1, Math.floor(Number(amountRaw)));
    await fetch("/api/crm/support/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: params.ticketId,
        userId: ticket.userId,
        coinsAmount,
      }),
    });
    await load();
  };

  if (loading || !ticket) return <div className="text-sm text-muted">Loading ticket...</div>;

  return (
    <div className="space-y-4">
      <Button variant="secondary" onClick={() => router.push("/crm/support")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Support
      </Button>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Ticket #{ticket.id.slice(0, 8)}</span>
              <Badge
                variant={
                  ticket.priority === "urgent" || ticket.priority === "high"
                    ? "danger"
                    : ticket.priority === "medium"
                      ? "warning"
                      : "default"
                }
              >
                {(ticket.priority || "low").toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>Type: {ticket.type || "-"}</div>
            <div>Subject: {ticket.subject || "-"}</div>
            <div>Description: {ticket.description || "-"}</div>
            <div>User: {ticket.userId || "-"}</div>
            {ticket.hostId ? <div>Host: {ticket.hostId}</div> : null}
            <div className="text-xs text-muted">
              Created: {toDate(ticket.createdAt)?.toLocaleString() || "-"}
            </div>
            <div className="text-xs text-muted">
              Updated: {toDate(ticket.updatedAt)?.toLocaleString() || "-"}
            </div>

            <div className="space-y-2 rounded-md border border-border bg-card p-3">
              <div className="text-xs font-medium text-muted">Ticket Controls</div>
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
              <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
              <Input
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                placeholder="Assign to"
              />
              <Textarea
                value={internalNotes}
                onChange={(event) => setInternalNotes(event.target.value)}
                placeholder="Internal notes"
              />
              <Button onClick={saveMeta}>Save Ticket Meta</Button>
            </div>

            {(ticket.type === "refund_request" || ticket.type === "host_complaint") && (
              <Button variant="danger" onClick={processRefund}>
                Process Refund
              </Button>
            )}

            <div className="rounded-md border border-border bg-card p-3 text-xs">
              <div className="mb-1 font-medium text-muted">User Snapshot</div>
              <div>Coin Balance: {toNumber(ticket.refundAmount)}</div>
              <div>Total Spent: Rs -</div>
            </div>
          </CardContent>
        </Card>

        <TicketThread ticketId={ticket.id} messages={ticket.messages || []} onSent={load} />
      </div>
    </div>
  );
}
