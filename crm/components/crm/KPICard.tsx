import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  metricChange?: string;
  deltaText?: string;
  deltaValue?: number;
  alert?: boolean;
  footer?: string;
  icon?: LucideIcon;
  variant?: "default" | "spotlight" | "cyan" | "emerald" | "danger" | string;
  badge?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  metricChange,
  deltaText,
  deltaValue,
  alert,
  footer,
  className,
}: KPICardProps) {
  // If deltaValue is provided, format it clean like "+12% vs last week"
  let computedChange = metricChange;
  if (!computedChange && typeof deltaValue === "number") {
    computedChange = `${deltaValue >= 0 ? "+" : ""}${deltaValue}% ${deltaText || "vs yesterday"}`;
  }

  return (
    <div className={cn("crm-clean-card flex flex-col justify-between", className)}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted">
            {title}
          </span>
          {alert && <span className="status-dot-amber" />}
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted border-t border-border pt-2">
        <span>{footer || "Current status"}</span>
        {computedChange && (
          <span className="font-medium text-accent">
            {computedChange}
          </span>
        )}
      </div>
    </div>
  );
}
