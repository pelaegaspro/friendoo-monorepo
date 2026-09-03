"use client";

import { useCallback, useEffect, useState } from "react";
import { CampaignWizard } from "@/components/crm/CampaignWizard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { toDate } from "@/lib/utils";
import { crmFetch } from "@/lib/client";

interface Campaign {
  id: string;
  name?: string;
  segment?: string;
  type?: "push" | "inapp" | "both";
  status?: "draft" | "scheduled" | "sent" | "failed";
  targetCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  sentAt?: unknown;
  createdAt?: unknown;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const json = await crmFetch<{ campaigns?: Campaign[] }>("/api/crm/campaigns/list");
    setCampaigns(json.campaigns || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadCampaigns);
  }, [loadCampaigns]);

  return (
    <div className="space-y-4">
      <CampaignWizard onCreated={loadCampaigns} />

      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted">Loading campaigns...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <thead className="bg-surface">
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Date</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name || "-"}</TableCell>
                      <TableCell>{campaign.segment || "-"}</TableCell>
                      <TableCell>{campaign.type || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            campaign.status === "sent"
                              ? "success"
                              : campaign.status === "failed"
                                ? "danger"
                                : campaign.status === "scheduled"
                                  ? "warning"
                                  : "default"
                          }
                        >
                          {(campaign.status || "draft").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.targetCount || 0}</TableCell>
                      <TableCell>{campaign.deliveredCount || 0}</TableCell>
                      <TableCell>{campaign.openedCount || 0}</TableCell>
                      <TableCell>
                        {toDate(campaign.sentAt || campaign.createdAt)?.toLocaleString() || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Triggers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-md border border-border bg-card p-3 text-sm">
            <div className="font-medium">Low Balance Warning</div>
            <div className="mt-1 text-xs text-muted">
              Fires when coin balance drops below 15 after recent call activity.
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-3 text-sm">
            <div className="font-medium">Inactive Re-engagement</div>
            <div className="mt-1 text-xs text-muted">
              Scheduled daily at 10:00 AM IST for paid users inactive 3+ days.
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-3 text-sm">
            <div className="font-medium">VIP Reward</div>
            <div className="mt-1 text-xs text-muted">
              Adds 50 bonus coins when total purchases cross 500 coins.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
