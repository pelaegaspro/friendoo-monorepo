/** Canonical call + presence state helpers (dual-read status/state during migration). */

export const CALL_STATES = [
  'idle',
  'ringing',
  'accepted',
  'connecting',
  'active',
  'ending',
  'ended',
  'rejected',
  'timeout',
  'failed',
  'missed',
] as const;

export type CallState = (typeof CALL_STATES)[number];

export const TERMINAL_CALL_STATES: CallState[] = [
  'ended',
  'rejected',
  'timeout',
  'failed',
  'missed',
];

export function readCallState(data: Record<string, unknown> | undefined): CallState {
  if (!data) return 'idle';
  const raw = (data.state as string) || (data.status as string) || 'idle';
  if (CALL_STATES.includes(raw as CallState)) return raw as CallState;
  if (raw === 'active') return 'active';
  if (raw === 'ringing') return 'ringing';
  return 'idle';
}

export function dualStateWrite(state: CallState): Record<string, string> {
  // Write both fields during migration period.
  // After all clients read 'state', drop 'status'.
  return { state, status: state };
}

export type PresenceStatus = 'online' | 'busy' | 'offline';

export function readPresenceStatus(data: Record<string, unknown> | undefined): PresenceStatus {
  if (!data) return 'offline';
  const s = data.status as string;
  if (s === 'online' || s === 'busy' || s === 'offline') return s;
  return 'offline';
}
