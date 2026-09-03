"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SimpleTabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { cn, toDate } from "@/lib/utils";
import { crmFetch } from "@/lib/client";

interface Ticket {
  id: string;
  userId?: string;
  type?: string;
  subject?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "open" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const tabs = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "urgent", label: "Urgent" },
];

const initialDefaultTickets: Ticket[] = [
  {
    id: "t-001",
    userId: "usr_99182",
    type: "refund_request",
    subject: "Coin deduction on disconnected call",
    description: "Call disconnected after 4 seconds but 20 coins were deducted from wallet balance.",
    status: "open",
    priority: "high",
    assignedTo: "Support Lead",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "t-002",
    userId: "usr_88210",
    type: "user_complaint",
    subject: "Audio echo during host session",
    description: "Severe robotic feedback heard on mobile audio connection with host Priya.",
    status: "open",
    priority: "medium",
    assignedTo: "Quality Agent",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "t-003",
    userId: "usr_33190",
    type: "general",
    subject: "VIP Tier badge unlock inquiry",
    description: "User purchased 500 coins package and requested VIP Gold Lounge badge activation.",
    status: "resolved",
    priority: "low",
    assignedTo: "Concierge Team",
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

export default function SupportPage() {
  const [status, setStatus] = useState("all");
  const [tickets, setTickets] = useState<Ticket[]>(initialDefaultTickets);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    hostId: "",
    type: "general",
    priority: "medium",
    subject: "",
    description: "",
    assignedTo: "",
    flaggedUserId: "",
  });

  const loadTickets = useCallback(async () => {
    try {
      const query = status === "urgent" ? "all" : status;
      const json = await crmFetch<{ tickets?: Ticket[] }>(`/api/crm/support/tickets?status=${query}`);
      if (json && Array.isArray(json.tickets)) {
        setTickets(json.tickets);
      }
    } catch (e) {
      console.warn("Using baseline tickets state:", e);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void Promise.resolve().then(loadTickets);
  }, [loadTickets]);

  const displayedTickets = useMemo(() => {
    if (status !== "urgent") return tickets;
    return tickets.filter((ticket) => ticket.priority === "urgent");
  }, [status, tickets]);

  const createTicket = async () => {
    await fetch("/api/crm/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreateOpen(false);
    setForm({
      userId: "",
      hostId: "",
      type: "general",
      priority: "medium",
      subject: "",
      description: "",
      assignedTo: "",
      flaggedUserId: "",
    });
    await loadTickets();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Support Ticket System</CardTitle>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimpleTabs items={tabs} value={status} onChange={setStatus} />
          {loading ? (
            <div className="text-sm text-muted">Loading tickets...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <thead className="bg-surface">
                  <tr>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {displayedTickets.map((ticket) => {
                    const createdAt = toDate(ticket.createdAt);
                    const updatedAt = toDate(ticket.updatedAt);
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-xs">{ticket.id.slice(0, 8)}</TableCell>
                        <TableCell>{ticket.userId || "-"}</TableCell>
                        <TableCell>{ticket.type || "-"}</TableCell>
                        <TableCell className="font-medium">{ticket.subject || "-"}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{ticket.assignedTo || "-"}</TableCell>
                        <TableCell>{createdAt ? format(createdAt, "dd MMM HH:mm") : "-"}</TableCell>
                        <TableCell>{updatedAt ? format(updatedAt, "dd MMM HH:mm") : "-"}</TableCell>
                        <TableCell>
                          <Link href={`/crm/support/${ticket.id}`} className="text-accent hover:underline">
                            Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div
        className={cn(
          "fixed inset-0 z-50 transition",
          createOpen ? "pointer-events-auto bg-black/50 opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="absolute left-1/2 top-1/2 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold">Create Ticket</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="User ID"
              value={form.userId}
              onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
            />
            <Input
              placeholder="Host ID (optional)"
              value={form.hostId}
              onChange={(event) => setForm((current) => ({ ...current, hostId: event.target.value }))}
            />
            <Select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            >
              <option value="user_complaint">User Complaint</option>
              <option value="host_complaint">Host Complaint</option>
              <option value="refund_request">Refund Request</option>
              <option value="general">General</option>
            </Select>
            <Select
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Input
              placeholder="Assigned to"
              value={form.assignedTo}
              onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))}
            />
            <Input
              placeholder="Flagged User ID (for host complaint)"
              value={form.flaggedUserId}
              onChange={(event) => setForm((current) => ({ ...current, flaggedUserId: event.target.value }))}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Subject"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
            />
            <Textarea
              className="sm:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTicket}>Submit Ticket</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
