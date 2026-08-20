import React from "react";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  deltaText?: string;
  deltaValue?: number;
  alert?: boolean;
  footer?: string;
  icon?: LucideIcon;
  variant?: "default" | "spotlight" | "cyan" | "emerald" | "danger";
  badge?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  deltaText,
  deltaValue,
  alert,
  footer,
  icon: Icon,
  variant = "default",
  badge,
  className,
}: KPICardProps) {
  const isPositive = (deltaValue ?? 0) >= 0;
  const showDelta = typeof deltaValue === "number";

  const variantClass = {
    default: "bento-card",
    spotlight: "bento-card-spotlight",
    cyan: "bento-card-cyan",
    emerald: "bento-card-emerald",
    danger: "bento-card border-red-500/40 bg-red-950/20",
  }[alert ? "danger" : variant];

  return (
    <div className={cn(variantClass, "flex flex-col justify-between p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-foreground">
                {badge}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground transition-colors group-hover:text-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {value}
        </div>
        
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {showDelta ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                isPositive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {deltaText || `${Math.abs(deltaValue).toFixed(1)}% vs yesterday`}
            </div>
          ) : null}
          {footer ? (
            <span className="text-xs text-muted-foreground">
              {footer}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

