"use client";

import { formatDistanceToNow } from "date-fns";
import { FraudAlertRecord } from "@/lib/types";
import { toDate } from "@/lib/utils";

interface FraudAlertCardProps {
  alert: FraudAlertRecord;
  onAction: (alertId: string, action: string) => void;
}

export function FraudAlertCard({ alert, onAction }: FraudAlertCardProps) {
  const createdAt = toDate(alert.createdAt) ?? new Date();
  const isHighSeverity = alert.severity === "urgent" || alert.severity === "high";

  return (
    <div className="rounded-[12px] border border-border bg-surface p-4 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={isHighSeverity ? "status-dot-amber" : "status-dot-neutral"} />
            <h4 className="text-sm font-medium text-foreground">{alert.type || "Review request"}</h4>
          </div>
          <span className="text-xs text-muted font-medium capitalize">
            {alert.severity || "standard"}
          </span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          {alert.description || "Review pattern noted for account activity."}
        </p>
      </div>

      <div className="mt-4 pt-2 border-t border-border flex items-center justify-between text-xs">
        <span className="text-muted">
          User {alert.userId ? alert.userId.slice(0, 8) : "Anonymous"} • {formatDistanceToNow(createdAt, { addSuffix: true })}
        </span>
        <button
          onClick={() => onAction(alert.id, "resolve")}
          className="text-xs font-medium text-accent hover:underline"
        >
          Resolve
        </button>
      </div>
    </div>
  );
}
