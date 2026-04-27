"use client";

import { useCallback, useEffect, useState } from "react";
import { FraudAlertCard } from "@/components/crm/FraudAlertCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
      fetch("/api/crm/fraud/alerts", { cache: "no-store" }),
      fetch("/api/crm/config/alerts", { cache: "no-store" }),
    ]);
    const alertsJson = await alertsResponse.json();
    const configJson = await configResponse.json();
    setAlerts(alertsJson.alerts || []);
    if (configJson.data) {
      setConfig((current) => ({ ...current, ...(configJson.data as Record<string, number>) }));
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
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fraud & Risk Center</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted">Loading alerts...</div>
          ) : alerts.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {alerts.map((alert) => (
                <FraudAlertCard key={alert.id} alert={alert} onAction={runAction} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted">No open fraud alerts.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Config</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Input
            type="number"
            value={config.highTopupThreshold}
            onChange={(event) =>
              setConfig((current) => ({ ...current, highTopupThreshold: Number(event.target.value) }))
            }
            placeholder="High top-up threshold (Rs)"
          />
          <Input
            type="number"
            value={config.highTopupWindowDays}
            onChange={(event) =>
              setConfig((current) => ({ ...current, highTopupWindowDays: Number(event.target.value) }))
            }
            placeholder="Top-up window (days)"
          />
          <Input
            type="number"
            value={config.complaintThreshold}
            onChange={(event) =>
              setConfig((current) => ({ ...current, complaintThreshold: Number(event.target.value) }))
            }
            placeholder="Complaint threshold"
          />
          <Input
            type="number"
            value={config.complaintWindowDays}
            onChange={(event) =>
              setConfig((current) => ({ ...current, complaintWindowDays: Number(event.target.value) }))
            }
            placeholder="Complaint window (days)"
          />
          <Input
            type="number"
            value={config.shortCallThresholdSeconds}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                shortCallThresholdSeconds: Number(event.target.value),
              }))
            }
            placeholder="Short call threshold (seconds)"
          />
          <Input
            type="number"
            value={config.deviceThreshold}
            onChange={(event) =>
              setConfig((current) => ({ ...current, deviceThreshold: Number(event.target.value) }))
            }
            placeholder="Device threshold"
          />
          <div className="md:col-span-2 xl:col-span-3">
            <Button onClick={saveConfig}>Save Risk Config</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
