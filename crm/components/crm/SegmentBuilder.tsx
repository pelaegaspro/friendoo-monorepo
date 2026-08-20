"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CustomSegmentFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SegmentBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, filters: CustomSegmentFilter) => void;
}

export function SegmentBuilder({ open, onClose, onSave }: SegmentBuilderProps) {
  const [name, setName] = useState("");
  const [minCoins, setMinCoins] = useState("");
  const [maxCoins, setMaxCoins] = useState("");
  const [lastActiveDays, setLastActiveDays] = useState("");
  const [minSpendInr, setMinSpendInr] = useState("");
  const [minCalls, setMinCalls] = useState("");
  const [city, setCity] = useState("");
  const [language, setLanguage] = useState("");
  const [isHost, setIsHost] = useState("any");
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const filters = useMemo<CustomSegmentFilter>(
    () => ({
      minCoins: minCoins ? Number(minCoins) : undefined,
      maxCoins: maxCoins ? Number(maxCoins) : undefined,
      lastActiveDays: lastActiveDays ? Number(lastActiveDays) : undefined,
      minSpendInr: minSpendInr ? Number(minSpendInr) : undefined,
      minCalls: minCalls ? Number(minCalls) : undefined,
      city: city || undefined,
      language: language || undefined,
      isHost: isHost === "any" ? undefined : isHost === "yes",
    }),
    [city, isHost, language, lastActiveDays, maxCoins, minCalls, minCoins, minSpendInr],
  );

  const runPreview = async () => {
    const query = new URLSearchParams({
      segment: "custom",
      customFilter: JSON.stringify(filters),
    });
    const res = await fetch(`/api/crm/users/list?${query.toString()}`);
    const json = await res.json();
    setPreviewCount(json.count ?? 0);
  };

  const save = () => {
    if (!name.trim()) return;
    onSave(name.trim(), filters);
    setPreviewCount(null);
    onClose();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto bg-black/50 opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        className={cn(
          "absolute left-1/2 top-1/2 w-[min(92vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 transition",
          open ? "scale-100" : "scale-95",
        )}
      >
        <h3 className="text-lg font-semibold">Create Segment</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input placeholder="Segment Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="Min Coins" value={minCoins} onChange={(e) => setMinCoins(e.target.value)} />
          <Input placeholder="Max Coins" value={maxCoins} onChange={(e) => setMaxCoins(e.target.value)} />
          <Input
            placeholder="Last active more than (days)"
            value={lastActiveDays}
            onChange={(e) => setLastActiveDays(e.target.value)}
          />
          <Input
            placeholder="Min spent (INR)"
            value={minSpendInr}
            onChange={(e) => setMinSpendInr(e.target.value)}
          />
          <Input placeholder="Min calls" value={minCalls} onChange={(e) => setMinCalls(e.target.value)} />
          <Input placeholder="Language" value={language} onChange={(e) => setLanguage(e.target.value)} />
          <Select value={isHost} onChange={(e) => setIsHost(e.target.value)}>
            <option value="any">Is Host: Any</option>
            <option value="yes">Is Host: Yes</option>
            <option value="no">Is Host: No</option>
          </Select>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="secondary" onClick={runPreview}>
            Preview Count
          </Button>
          <div className="text-sm text-muted">
            {previewCount === null ? "No preview yet" : `This matches ${previewCount} users`}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save Segment</Button>
        </div>
      </div>
    </div>
  );
}
