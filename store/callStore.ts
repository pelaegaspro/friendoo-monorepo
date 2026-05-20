import { create } from 'zustand';
import type { CallStatus } from '../src/types/calls';

type CallStoreState = {
  activeCallId: string | null;
  callStatus: CallStatus | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  agoraJoined: boolean;
  coinBalance: number;
};

type CallStoreActions = {
  setActiveCall: (callId: string | null) => void;
  setCallStatus: (status: CallStatus | null) => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  setAgoraJoined: (joined: boolean) => void;
  updateCoinBalance: (balance: number) => void;
};

export const useCallStore = create<CallStoreState & CallStoreActions>((set) => ({
  activeCallId: null,
  callStatus: null,
  isMuted: false,
  isSpeakerOn: false,
  agoraJoined: false,
  coinBalance: 0,

  setActiveCall: (callId) => set({ activeCallId: callId }),
  setCallStatus: (status) => set({ callStatus: status }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleSpeaker: () => set((s) => ({ isSpeakerOn: !s.isSpeakerOn })),
  setAgoraJoined: (joined) => set({ agoraJoined: joined }),
  updateCoinBalance: (balance) => set({ coinBalance: Math.max(0, balance) }),
}));

