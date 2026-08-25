"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, Zap, AlertTriangle, Sliders, CheckCircle2 } from "lucide-react";
import { FraudAlertCard } from "@/components/crm/FraudAlertCard";
import { KPICard } from "@/components/crm/KPICard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crmFetch } from "@/lib/client";

interface FraudAlert {
  id: string;
  userId?: string;
  type?: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "urgent";
  status?: "open" | "reviewed" | "dismissed";
  amount?: number;
  createdAt?: unknown;
}

export default function FraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    highTopupThreshold: 500,
    highTopupWindowDays: 1,
    complaintThreshold: 3,
    complaintWindowDays: 7,
    shortCallThresholdSeconds: 30,
    deviceThreshold: 3,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [alertsResponse, configResponse] = await Promise.all([
      crmFetch<{ alerts?: FraudAlert[] }>("/api/crm/fraud/alerts"),
      crmFetch<{ data?: Record<string, number> }>("/api/crm/config/alerts"),
    ]);
    setAlerts(alertsResponse.alerts || []);
    if (configResponse.data) {
      setConfig((current) => ({ ...current, ...configResponse.data }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (alertId: string, action: string) => {
    await fetch("/api/crm/fraud/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, action }),
    });
    await load();
  };

  const saveConfig = async () => {
    await fetch("/api/crm/config/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const urgentCount = alerts.filter(
    (a) => a.severity === "urgent" || a.severity === "high"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Fraud Sentry Bento
            </h1>
            <span className="bento-badge text-red-400">Risk Radar</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Real-time behavioral anomalies, rapid recharge velocity, and device fingerprint collisions.
          </p>
        </div>
      </div>

      {/* Row 1: Fraud Bento KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Open Risk Incidents"
          value={`${alerts.length}`}
          icon={ShieldAlert}
          variant={urgentCount > 0 ? "danger" : "default"}
          badge="Live Queue"
          footer="Awaiting operator triage"
        />
        <KPICard
          title="Critical Flags"
          value={`${urgentCount}`}
          icon={AlertTriangle}
          alert={urgentCount > 0}
          variant={urgentCount > 0 ? "danger" : "emerald"}
          footer="High & urgent severity"
        />
        <KPICard
          title="Velocity Sentry"
          value={`₹${config.highTopupThreshold}`}
          icon={Zap}
          variant="spotlight"
          badge="Threshold"
          footer={`Per ${config.highTopupWindowDays} day window`}
        />
        <KPICard
          title="Device Limiter"
          value={`Max ${config.deviceThreshold}`}
          icon={ShieldCheck}
          variant="cyan"
          badge="Fingerprint"
          footer="Concurrent user accounts"
        />
      </div>

      {/* Row 2: Live Incident Feed Bento */}
      <div className="bento-card">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Active Threat Stream</h3>
              <p className="text-xs text-muted-foreground">Automated triggers flagged by platform sentinel rules</p>
            </div>
          </div>
          <span className="bento-badge text-xs">
            {alerts.length} Incidents
          </span>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              Scanning security logs...
            </div>
          ) : alerts.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {alerts.map((alert) => (
                <FraudAlertCard key={alert.id} alert={alert} onAction={runAction} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
              <h4 className="mt-2 text-sm font-bold text-foreground">Zero Threats Detected</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                All caller signaling packets and wallet transactions match standard behavioral patterns.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Risk Threshold Configuration Bento */}
      <div className="bento-card">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Adaptive Risk Engine Rules</h3>
              <p className="text-xs text-muted-foreground">Tune automated fraud triggers and anomaly tolerances</p>
            </div>
          </div>
          {saved && (
            <span className="bento-pill-live">
              <CheckCircle2 className="h-3 w-3" />
              Saved Successfully
            </span>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">High Top-up Threshold (₹)</label>
            <Input
              type="number"
              value={config.highTopupThreshold}
              onChange={(e) =>
                setConfig((c) => ({ ...c, highTopupThreshold: Number(e.target.value) }))
              }
              placeholder="e.g. 500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Top-up Velocity Window (Days)</label>
            <Input
              type="number"
              value={config.highTopupWindowDays}
              onChange={(e) =>
                setConfig((c) => ({ ...c, highTopupWindowDays: Number(e.target.value) }))
              }
              placeholder="e.g. 1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Caller Complaint Threshold</label>
            <Input
              type="number"
              value={config.complaintThreshold}
              onChange={(e) =>
                setConfig((c) => ({ ...c, complaintThreshold: Number(e.target.value) }))
              }
              placeholder="e.g. 3"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Complaint Evaluation Window (Days)</label>
            <Input
              type="number"
              value={config.complaintWindowDays}
              onChange={(e) =>
                setConfig((c) => ({ ...c, complaintWindowDays: Number(e.target.value) }))
              }
              placeholder="e.g. 7"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Short Ghost Call Threshold (Sec)</label>
            <Input
              type="number"
              value={config.shortCallThresholdSeconds}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  shortCallThresholdSeconds: Number(e.target.value),
                }))
              }
              placeholder="e.g. 30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Max Accounts Per Device</label>
            <Input
              type="number"
              value={config.deviceThreshold}
              onChange={(e) =>
                setConfig((c) => ({ ...c, deviceThreshold: Number(e.target.value) }))
              }
              placeholder="e.g. 3"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3 pt-2">
            <Button onClick={saveConfig} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Save Risk Parameters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

