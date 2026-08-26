"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Eye,
  Gift,
  MessageCircle,
  ShieldBan,
  Wallet,
  Users,
  Sparkles,
  Flame,
  AlertTriangle,
  Search,
  PlusCircle,
} from "lucide-react";
import { SegmentBuilder } from "@/components/crm/SegmentBuilder";
import { UserJourneySheet } from "@/components/crm/UserJourneySheet";
import { KPICard } from "@/components/crm/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleTabs } from "@/components/ui/tabs";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { useCrmStore } from "@/store/useCrmStore";
import { CustomSegmentFilter, SegmentKey } from "@/lib/types";
import { toDate } from "@/lib/utils";
import { crmFetch } from "@/lib/client";

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
  { value: "all", label: "All Users" },
  { value: "new_user", label: "New Users" },
  { value: "low_balance", label: "Low Balance" },
  { value: "vip", label: "VIP Spenders" },
  { value: "inactive", label: "Inactive Dormant" },
  { value: "first_call", label: "First Call Completed" },
  { value: "at_risk", label: "At Risk Churn" },
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
    const json = await crmFetch<{ users?: UserRow[] }>(`/api/crm/users/list?${params.toString()}`);
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
    const json = await crmFetch<{ user?: { displayName?: string; username?: string }; timeline?: Array<{ title: string; detail?: string; level?: "ok" | "warn"; date: Date }> }>(`/api/crm/users/journey/${uid}`);
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
    const response = await fetch("/api/crm/users/addCoins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        amount,
        reason: "CRM manual credit",
        idempotencyKey: `crm_adjust:${uid}:${crypto.randomUUID()}`,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "Failed to add coins");
    }
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
    return "Member";
  };

  const vipCount = users.filter((u) => (u.totalSpentInr || 0) > 500).length;
  const lowBalanceCount = users.filter((u) => (u.coinBalance || 0) < 15).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              User Intelligence Bento
            </h1>
            <span className="bento-badge text-purple-400">Cohort Explorer</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Segment telemetry, user journey timeline tracing, and direct coin interventions.
          </p>
        </div>
        <Button onClick={() => setBuilderOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Dynamic Segment
        </Button>
      </div>

      {/* Bento KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Segment Population"
          value={`${users.length}`}
          icon={Users}
          variant="spotlight"
          badge="Cohort"
          footer="Active users in view"
        />
        <KPICard
          title="VIP High Spenders"
          value={`${vipCount}`}
          icon={Sparkles}
          variant="cyan"
          badge="Whales"
          footer="Spent > ₹500 lifetime"
        />
        <KPICard
          title="Low Balance Risk"
          value={`${lowBalanceCount}`}
          icon={AlertTriangle}
          alert={lowBalanceCount > 5}
          variant={lowBalanceCount > 5 ? "danger" : "default"}
          badge="Recharge Prompt"
          footer="< 15 coins remaining"
        />
        <KPICard
          title="Conversion Velocity"
          value="68.4%"
          icon={Flame}
          variant="emerald"
          badge="D7 Retention"
          footer="Registered to paid call"
        />
      </div>

      {/* Bento Intelligence Matrix */}
      <div className="bento-card">
        <div className="space-y-4">
          <div className="overflow-x-auto pb-1">
            <SimpleTabs items={tabs} value={selectedSegment} onChange={(value) => setSelectedSegment(value as SegmentKey)} />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Showing {filteredUsers.length} of {users.length} members
            </span>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              Retrieving member cohort telemetry...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground">User</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Cohort Tag</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Coin Balance</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Lifetime Spent</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Calls</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Last Active</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right">Interventions</TableHead>
                  </TableRow>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const activeAt = toDate(user.lastActive);
                    const tag = segmentFromUser(user);
                    return (
                      <TableRow key={user.uid} className="border-b border-white/5 transition-colors hover:bg-white/5">
                        <TableCell className="font-bold text-foreground text-xs">{user.displayName || "Anonymous User"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{user.phone || "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tag === "VIP"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : tag === "Low Balance"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            }`}
                          >
                            {tag}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-amber-400 font-bold">
                          {(user.coinBalance || 0).toLocaleString()} 🪙
                        </TableCell>
                        <TableCell className="font-mono text-xs text-emerald-400 font-semibold">
                          ₹{(user.totalSpentInr || 0).toFixed(0)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold">{user.totalCalls || 0}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {activeAt ? formatDistanceToNow(activeAt, { addSuffix: true }) : "—"}
                        </TableCell>
                        <TableCell>
                          {user.isBanned ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                              BANNED
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              ACTIVE
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="secondary" title="View Timeline" onClick={() => openJourney(user.uid)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="secondary" title="Credit Coins" onClick={() => addCoins(user.uid)}>
                              <Wallet className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              title={user.isBanned ? "Unban" : "Ban User"}
                              onClick={() => toggleBan(user.uid, !user.isBanned)}
                            >
                              <ShieldBan className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="secondary" title="Direct Push Message" onClick={() => sendMessage(user.uid)}>
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" title="Dispatch Offer" onClick={() => sendOffer(user.uid)}>
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
        </div>
      </div>

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

