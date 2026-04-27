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
  { value: "all", label: "All Users" },
  { value: "new_user", label: "New Users" },
  { value: "low_balance", label: "Low Balance" },
  { value: "inactive", label: "Inactive" },
  { value: "vip", label: "VIP" },
  { value: "first_call", label: "First Call" },
  { value: "at_risk", label: "At Risk" },
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

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold">Create Campaign</div>
      <div className="text-xs text-muted">Step {step} of 4</div>

      {step === 1 ? (
        <div className="space-y-3">
          <Select value={segment} onChange={(e) => setSegment(e.target.value as SegmentKey)}>
            {segmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={previewAudience}>
            Preview Audience
          </Button>
          <div className="text-sm text-muted">
            {previewCount === null ? "No preview yet" : `This will reach ${previewCount} users`}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <Input placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={type} onChange={(e) => setType(e.target.value as "push" | "inapp" | "both")}>
            <option value="both">Push + In-app</option>
            <option value="push">Push only</option>
            <option value="inapp">In-app only</option>
          </Select>
          <Input placeholder="Notification title (max 50)" maxLength={50} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Notification body (max 150)"
            maxLength={150}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <Select value={scheduleMode} onChange={(e) => setScheduleMode(e.target.value as "now" | "later")}>
            <option value="now">Send now</option>
            <option value="later">Schedule for later</option>
          </Select>
          {scheduleMode === "later" ? (
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          ) : null}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-2 text-sm">
          <div>Name: {name}</div>
          <div>Segment: {segment}</div>
          <div>Type: {type}</div>
          <div>Title: {title}</div>
          <div className="text-muted">{body}</div>
        </div>
      ) : null}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep((prev) => Math.max(1, prev - 1))} disabled={step === 1}>
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((prev) => Math.min(4, prev + 1))} disabled={!canNext}>
            Next
          </Button>
        ) : (
          <Button onClick={launch} disabled={creating || sending}>
            {sending ? "Launching..." : creating ? "Creating..." : "Launch"}
          </Button>
        )}
      </div>
    </div>
  );
}
