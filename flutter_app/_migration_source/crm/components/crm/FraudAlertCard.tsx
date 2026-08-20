"use client";

import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FraudAlertRecord } from "@/lib/types";
import { toDate } from "@/lib/utils";

interface FraudAlertCardProps {
  alert: FraudAlertRecord;
  onAction: (alertId: string, action: string) => void;
}

function severityVariant(severity?: string) {
  if (severity === "urgent" || severity === "high") return "danger";
  if (severity === "medium") return "warning";
  return "default";
}

export function FraudAlertCard({ alert, onAction }: FraudAlertCardProps) {
  const createdAt = toDate(alert.createdAt) ?? new Date();
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{alert.type || "Fraud alert"}</CardTitle>
          <Badge variant={severityVariant(alert.severity)}>
            {(alert.severity || "low").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted">{alert.description || "-"}</div>
        <div className="text-xs text-muted">
          User: {alert.userId || "-"} • {formatDistanceToNow(createdAt, { addSuffix: true })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => onAction(alert.id, "dismiss")}>
            Dismiss
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onAction(alert.id, "warn_user")}>
            Warn User
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onAction(alert.id, "auto_refund")}>
            Auto Refund
          </Button>
          <Button size="sm" variant="danger" onClick={() => onAction(alert.id, "ban_user")}>
            Ban User
          </Button>
          <Button size="sm" onClick={() => onAction(alert.id, "escalate")}>
            Escalate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
