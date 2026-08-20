"use client";

import { create } from "zustand";
import { SegmentKey } from "@/lib/types";

interface CrmState {
  selectedSegment: SegmentKey;
  setSelectedSegment: (segment: SegmentKey) => void;
  selectedUserIds: string[];
  toggleUserSelection: (uid: string) => void;
  clearSelection: () => void;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  selectedSegment: "all",
  setSelectedSegment: (segment) => set({ selectedSegment: segment }),
  selectedUserIds: [],
  toggleUserSelection: (uid) => {
    const selected = new Set(get().selectedUserIds);
    if (selected.has(uid)) selected.delete(uid);
    else selected.add(uid);
    set({ selectedUserIds: Array.from(selected) });
  },
  clearSelection: () => set({ selectedUserIds: [] }),
}));
