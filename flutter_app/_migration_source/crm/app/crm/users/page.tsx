"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Eye, Gift, MessageCircle, ShieldBan, Wallet } from "lucide-react";
import { SegmentBuilder } from "@/components/crm/SegmentBuilder";
import { UserJourneySheet } from "@/components/crm/UserJourneySheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SimpleTabs } from "@/components/ui/tabs";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { useCrmStore } from "@/store/useCrmStore";
import { CustomSegmentFilter, SegmentKey } from "@/lib/types";
import { toDate } from "@/lib/utils";

type UserRow = {
  uid: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  coinBalance?: number;
  totalSpentInr?: number;
  totalCalls?: number;
  lastActive?: unknown;
  isBanned?: boolean;
  isHost?: boolean;
};

const defaultTabs: Array<{ value: SegmentKey; label: string }> = [
  { value: "all", label: "All" },
  { value: "new_user", label: "New" },
  { value: "low_balance", label: "Low Balance" },
  { value: "vip", label: "VIP" },
  { value: "inactive", label: "Inactive" },
  { value: "first_call", label: "First Call" },
  { value: "at_risk", label: "At Risk" },
];

export default function UsersPage() {
  const { selectedSegment, setSelectedSegment } = useCrmStore();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [journeyTimeline, setJourneyTimeline] = useState<
    Array<{ title: string; detail?: string; level?: "ok" | "warn"; date: string }>
  >([]);
  const [journeyUserName, setJourneyUserName] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [customSegments, setCustomSegments] = useState<
    Array<{ key: string; label: string; filters: CustomSegmentFilter }>
  >([]);

  const activeCustom = useMemo(
    () => customSegments.find((segment) => segment.key === selectedSegment),
    [customSegments, selectedSegment],
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("segment", activeCustom ? "custom" : selectedSegment);
    if (activeCustom) params.set("customFilter", JSON.stringify(activeCustom.filters));
    const response = await fetch(`/api/crm/users/list?${params.toString()}`, { cache: "no-store" });
    const json = await response.json();
    setUsers(json.users || []);
    setLoading(false);
  }, [activeCustom, selectedSegment]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const tabs = useMemo(
    () => [
      ...defaultTabs.map((tab) => ({ value: tab.value as string, label: tab.label })),
      ...customSegments.map((segment) => ({ value: segment.key, label: segment.label })),
    ],
    [customSegments],
  );

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => {
      const name = (user.displayName || "").toLowerCase();
      const phone = (user.phone || "").toLowerCase();
      return name.includes(needle) || phone.includes(needle);
    });
  }, [query, users]);

  const openJourney = async (uid: string) => {
    const response = await fetch(`/api/crm/users/journey/${uid}`, { cache: "no-store" });
    const json = await response.json();
    setJourneyUserName(json.user?.displayName || json.user?.username || "User");
    setJourneyTimeline(
      (json.timeline || []).map((event: { title: string; detail?: string; level?: "ok" | "warn"; date: Date }) => ({
        ...event,
        date: new Date(event.date).toISOString(),
      })),
    );
    setJourneyOpen(true);
  };

  const addCoins = async (uid: string) => {
    const amountRaw = window.prompt("Add coins amount:");
    if (!amountRaw) return;
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) return;
    await fetch("/api/crm/users/addCoins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, amount, reason: "CRM manual credit" }),
    });
    await loadUsers();
  };

  const toggleBan = async (uid: string, banned: boolean) => {
    await fetch("/api/crm/users/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, banned }),
    });
    await loadUsers();
  };

  const sendMessage = async (uid: string) => {
    const message = window.prompt("Message for this user:");
    if (!message?.trim()) return;
    await fetch("/api/crm/users/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, message }),
    });
  };

  const sendOffer = async (uid: string) => {
    const offerType = window.prompt("Offer type: free_coins / bonus_coins / discount", "free_coins");
    if (!offerType) return;
    const coins = offerType === "free_coins" ? Number(window.prompt("Coins to credit:", "20") || "0") : 0;
    await fetch("/api/crm/users/sendOffer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uids: [uid],
        offerType,
        coins,
        title: "Friendoo Offer",
        body: "You have a special offer waiting in Friendoo.",
      }),
    });
  };

  const saveCustomSegment = (name: string, filters: CustomSegmentFilter) => {
    const key = `custom_${Date.now()}`;
    setCustomSegments((current) => [...current, { key, label: name, filters }]);
    setSelectedSegment(key as SegmentKey);
  };

  const segmentFromUser = (user: UserRow) => {
    if ((user.coinBalance || 0) < 15) return "Low Balance";
    if ((user.totalSpentInr || 0) > 500) return "VIP";
    if ((user.totalCalls || 0) === 1) return "First Call";
    return "All";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>User Intelligence</CardTitle>
          <Button variant="secondary" onClick={() => setBuilderOpen(true)}>
            Create Segment
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimpleTabs items={tabs} value={selectedSegment} onChange={(value) => setSelectedSegment(value as SegmentKey)} />
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search name or phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="max-w-xs"
            />
          </div>
          {loading ? (
            <div className="text-sm text-muted">Loading users...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <thead className="bg-surface">
                  <tr>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Coin Balance</TableHead>
                    <TableHead>Total Spent (Rs)</TableHead>
                    <TableHead>Total Calls</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const activeAt = toDate(user.lastActive);
                    return (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">{user.displayName || "Unknown User"}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="accent">{segmentFromUser(user)}</Badge>
                        </TableCell>
                        <TableCell>{(user.coinBalance || 0).toLocaleString()}</TableCell>
                        <TableCell>{(user.totalSpentInr || 0).toFixed(0)}</TableCell>
                        <TableCell>{user.totalCalls || 0}</TableCell>
                        <TableCell>
                          {activeAt ? formatDistanceToNow(activeAt, { addSuffix: true }) : "-"}
                        </TableCell>
                        <TableCell>
                          {user.isBanned ? <Badge variant="danger">Banned</Badge> : <Badge variant="success">Active</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button size="sm" variant="secondary" onClick={() => openJourney(user.uid)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => addCoins(user.uid)}>
                              <Wallet className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => toggleBan(user.uid, !user.isBanned)}
                            >
                              <ShieldBan className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => sendMessage(user.uid)}>
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" onClick={() => sendOffer(user.uid)}>
                              <Gift className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

      <UserJourneySheet
        open={journeyOpen}
        onClose={() => setJourneyOpen(false)}
        userName={journeyUserName}
        timeline={journeyTimeline}
      />

      <SegmentBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} onSave={saveCustomSegment} />
    </div>
  );
}
