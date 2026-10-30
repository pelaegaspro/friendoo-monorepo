"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SegmentKey } from "@/lib/types";

interface CampaignWizardProps {
  onCreated?: () => void;
}

const segmentOptions: Array<{ value: SegmentKey; label: string }> = [
  { value: "all", label: "All Callers (Users)" },
  { value: "new_user", label: "New Callers" },
  { value: "low_balance", label: "Low Balance" },
  { value: "inactive", label: "Inactive" },
  { value: "vip", label: "VIP" },
  { value: "first_call", label: "First Call" },
  { value: "at_risk", label: "At Risk" },
];

const templatePrompts = [
  {
    label: "🎁 Welcome Top-up Bonus",
    title: "Claim your 50 Bonus Coins! 🎁",
    body: "Connect with verified hosts right now. Your bonus coins are waiting inside!",
  },
  {
    label: "🎧 Star Host Online",
    title: "Your favorite hosts are live! 🎧",
    body: "Jump into friendly audio conversations with top-rated regional hosts.",
  },
  {
    label: "⚡ Limited Offer",
    title: "Exclusive 20% Extra Coins ⚡",
    body: "Recharge now and get 20% extra coins on all voice calls today.",
  },
];

export function CampaignWizard({ onCreated }: CampaignWizardProps) {
  const [step, setStep] = useState(1);
  const [segment, setSegment] = useState<SegmentKey>("all");
  const [name, setName] = useState("");
  const [type, setType] = useState<"push" | "inapp" | "both">("both");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const canNext = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return Boolean(name.trim() && title.trim() && body.trim());
    if (step === 3) return scheduleMode === "now" || Boolean(scheduledAt);
    return true;
  }, [body, name, scheduleMode, scheduledAt, step, title]);

  const previewAudience = async () => {
    const response = await fetch(`/api/crm/users/list?segment=${segment}`);
    const json = await response.json();
    setPreviewCount(json.count ?? 0);
  };

  const applyTemplate = (t: (typeof templatePrompts)[0]) => {
    setName(t.label.replace(/[^a-zA-Z0-9 ]/g, "").trim());
    setTitle(t.title);
    setBody(t.body);
  };

  const launch = async () => {
    setCreating(true);
    try {
      const createRes = await fetch("/api/crm/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          segment,
          title,
          body,
          scheduledAt: scheduleMode === "later" ? scheduledAt : null,
        }),
      });
      const created = await createRes.json();
      if (!created.campaignId) return;

      if (scheduleMode === "now") {
        setSending(true);
        await fetch("/api/crm/campaigns/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: created.campaignId }),
        });
        setSending(false);
      }
      onCreated?.();
      setStep(1);
      setName("");
      setTitle("");
      setBody("");
      setPreviewCount(null);
    } finally {
      setCreating(false);
      setSending(false);
    }
  };

  const stepTitles = ["1. Audience", "2. Message Content", "3. Schedule", "4. Review & Launch"];

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Campaign Creation Wizard</h3>
          <p className="text-xs text-muted-foreground">Engage your audience with targeted push & in-app prompts</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Step {step} of 4
        </span>
      </div>

      {/* Step Progress Pills */}
      <div className="grid grid-cols-4 gap-2">
        {stepTitles.map((st, idx) => (
          <div
            key={st}
            className={`h-1.5 rounded-full transition-all ${
              idx + 1 <= step ? "bg-primary" : "bg-muted/40"
            }`}
          />
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <label className="block text-xs font-medium text-foreground">Target User Segment</label>
          <Select value={segment} onChange={(e) => setSegment(e.target.value as SegmentKey)}>
            {segmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={previewAudience}>
              Preview Audience Count
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              {previewCount === null ? "Click preview to calculate active reach" : `Reaches ~${previewCount} active users`}
            </span>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Quick Template Prompts</label>
            <div className="flex flex-wrap gap-2">
              {templatePrompts.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Internal Campaign Name (e.g. Summer Promo 2026)" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={type} onChange={(e) => setType(e.target.value as "push" | "inapp" | "both")}>
            <option value="both">Push Notification + In-App Banner</option>
            <option value="push">Push Notification Only</option>
            <option value="inapp">In-App Banner Only</option>
          </Select>
          <Input placeholder="Notification Title (max 50 chars)" maxLength={50} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Notification Body text (max 150 chars)"
            maxLength={150}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <label className="block text-xs font-medium">Delivery Schedule</label>
          <Select value={scheduleMode} onChange={(e) => setScheduleMode(e.target.value as "now" | "later")}>
            <option value="now">Send Immediately (Instant Broadcast)</option>
            <option value="later">Schedule for Future Time</option>
          </Select>
          {scheduleMode === "later" ? (
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notification Live Preview</div>
          <div className="rounded-lg border border-border bg-card p-3.5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Friendoo App</span>
              <span>Now</span>
            </div>
            <div className="font-bold text-sm text-foreground">{title || "Notification Title"}</div>
            <div className="text-xs text-muted-foreground">{body || "Notification body message preview..."}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div><span className="text-muted-foreground">Internal Name:</span> {name}</div>
            <div><span className="text-muted-foreground">Audience:</span> {segment}</div>
            <div><span className="text-muted-foreground">Channel:</span> {type}</div>
            <div><span className="text-muted-foreground">Schedule:</span> {scheduleMode === "now" ? "Immediate" : scheduledAt}</div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between pt-2 border-t border-border">
        <Button variant="secondary" onClick={() => setStep((prev) => Math.max(1, prev - 1))} disabled={step === 1}>
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((prev) => Math.min(4, prev + 1))} disabled={!canNext}>
            Continue
          </Button>
        ) : (
          <Button onClick={launch} disabled={creating || sending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            {sending ? "Broadcasting..." : creating ? "Creating Campaign..." : "🚀 Launch Campaign"}
          </Button>
        )}
      </div>
    </div>
  );
}
