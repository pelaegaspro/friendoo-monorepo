"use client";

import { formatDistanceToNow } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, toDate } from "@/lib/utils";

interface TimelineItem {
  title: string;
  detail?: string;
  level?: "ok" | "warn";
  date: string | Date;
}

interface UserJourneySheetProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  timeline: TimelineItem[];
}

export function UserJourneySheet({ open, onClose, userName, timeline }: UserJourneySheetProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto bg-black/50 opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-surface p-4 transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">User Journey</h2>
            <p className="text-xs text-muted">{userName || "User timeline"}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3 overflow-y-auto pr-1">
          {timeline.map((event, index) => {
            const date = toDate(event.date) ?? new Date();
            return (
              <div key={`${event.title}-${index}`} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{event.title}</div>
                  <Badge variant={event.level === "warn" ? "warning" : "success"}>
                    {event.level === "warn" ? "Alert" : "Done"}
                  </Badge>
                </div>
                {event.detail ? <div className="mt-1 text-xs text-muted">{event.detail}</div> : null}
                <div className="mt-1 text-[11px] text-muted">
                  {formatDistanceToNow(date, { addSuffix: true })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
