import type React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveChartProps {
  title: string;
  subtitle?: string;
  badge?: string;
  metaBadge?: string;
  icon?: LucideIcon;
  variant?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LiveChart({
  title,
  subtitle,
  badge,
  metaBadge,
  action,
  children,
  className,
}: LiveChartProps) {
  const displayBadge = metaBadge || badge;

  return (
    <div className={cn("crm-clean-card flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs text-muted">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {displayBadge && (
            <span className="text-xs text-muted font-medium">
              {displayBadge}
            </span>
          )}
          {action}
        </div>
      </div>

      <div className="pt-4 flex-1">
        {children}
      </div>
    </div>
  );
}
