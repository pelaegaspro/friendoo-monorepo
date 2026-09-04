import type React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveChartProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "spotlight" | "cyan" | "emerald";
}

export function LiveChart({
  title,
  subtitle,
  badge,
  icon: Icon,
  action,
  children,
  className,
  variant = "default",
}: LiveChartProps) {
  const variantClass = {
    default: "bento-card",
    spotlight: "bento-card-spotlight",
    cyan: "bento-card-cyan",
    emerald: "bento-card-emerald",
  }[variant];

  return (
    <div className={cn(variantClass, "flex flex-col justify-between", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-purple-400">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-foreground">{title}</h2>
              {badge && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

