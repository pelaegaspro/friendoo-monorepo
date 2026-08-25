"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { crmFetch } from "@/lib/client";

export default function SettingsPage() {
  const [revenue, setRevenue] = useState({
    hostRevenueShare: 0.7,
    minCallCoins: 15,
  });
  const [segmentConfig, setSegmentConfig] = useState({
    predefined: "new_user, low_balance, inactive, vip, first_call, at_risk",
    customRules: "Use custom segment builder to attach filters",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [revenueRes, segmentsRes] = await Promise.all([
        crmFetch<{ data?: Record<string, number> }>("/api/crm/config/revenue"),
        crmFetch<{ data?: Record<string, string> }>("/api/crm/config/segments"),
      ]);
      if (revenueRes.data) {
        setRevenue((current) => ({ ...current, ...revenueRes.data }));
      }
      if (segmentsRes.data) {
        setSegmentConfig((current) => ({
          ...current,
          ...segmentsRes.data,
        }));
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch("/api/crm/config/revenue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(revenue),
        }),
        fetch("/api/crm/config/segments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(segmentConfig),
        }),
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Config</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            step="0.01"
            value={revenue.hostRevenueShare}
            onChange={(event) =>
              setRevenue((current) => ({
                ...current,
                hostRevenueShare: Number(event.target.value),
              }))
            }
            placeholder="Host Revenue Share"
          />
          <Input
            type="number"
            value={revenue.minCallCoins}
            onChange={(event) =>
              setRevenue((current) => ({
                ...current,
                minCallCoins: Number(event.target.value),
              }))
            }
            placeholder="Minimum Call Coins"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segment Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={segmentConfig.predefined}
            onChange={(event) =>
              setSegmentConfig((current) => ({ ...current, predefined: event.target.value }))
            }
            placeholder="Predefined segments"
          />
          <Textarea
            value={segmentConfig.customRules}
            onChange={(event) =>
              setSegmentConfig((current) => ({ ...current, customRules: event.target.value }))
            }
            placeholder="Custom segment rules"
          />
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
