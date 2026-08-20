"use client";

import { formatDistanceToNow } from "date-fns";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const isUrgent = alert.severity === "urgent" || alert.severity === "high";

  return (
    <div className={`bento-card flex flex-col justify-between p-4 ${isUrgent ? 'border-red-500/40 bg-red-950/15' : ''}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isUrgent ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">{alert.type || "Fraud alert"}</h4>
              <span className="text-[11px] font-mono text-muted-foreground">ID: {alert.id.slice(0, 10)}</span>
            </div>
          </div>
          <Badge variant={severityVariant(alert.severity)}>
            {(alert.severity || "low").toUpperCase()}
          </Badge>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs leading-relaxed text-muted-foreground">
          {alert.description || "Unusual signaling activity detected."}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>User: <span className="font-mono text-foreground">{alert.userId || "Anonymous"}</span></span>
          <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
        <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5" onClick={() => onAction(alert.id, "dismiss")}>
          Dismiss
        </Button>
        <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5" onClick={() => onAction(alert.id, "warn_user")}>
          Warn
        </Button>
        <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5 text-amber-400 hover:text-amber-300" onClick={() => onAction(alert.id, "auto_refund")}>
          Refund
        </Button>
        <Button size="sm" variant="danger" className="h-7 text-xs px-2.5" onClick={() => onAction(alert.id, "ban_user")}>
          Ban
        </Button>
        <Button size="sm" className="h-7 text-xs px-2.5 ml-auto" onClick={() => onAction(alert.id, "escalate")}>
          Escalate
        </Button>
      </div>
    </div>
  );
}

