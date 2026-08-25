"use client";

import { cn } from "@/lib/utils";

interface TabItem {
  value: string;
  label: string;
}

interface SimpleTabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SimpleTabs({ items, value, onChange, className }: SimpleTabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm transition-colors",
            value === item.value
              ? "border-accent bg-accent/20 text-accent"
              : "border-border bg-surface text-foreground hover:bg-card",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
