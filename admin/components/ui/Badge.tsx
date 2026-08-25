import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-surface-elevated text-foreground border border-border",
        active: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        live: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        online: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        completed: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
        success: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        verified: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
        warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        danger: "bg-red-500/20 text-red-300 border border-red-500/30",
        banned: "bg-red-500/20 text-red-300 border border-red-500/30",
        rejected: "bg-red-500/20 text-red-300 border border-red-500/30",
        pending: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        accent: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  label?: React.ReactNode;
  variant?: any;
}

export function Badge({ className, variant = "default", label, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant: (variant in (badgeVariants as any)) ? variant : (variant as any) }), className)} {...props}>
      {label ?? children}
    </span>
  );
}

export default Badge;
