import type { User } from '@/types';

/** MVP v1: overlap of interests + languages, city match, recency hint. Returns 0–100. */
export function compatibilityScore(me: User, other: User): number {
  const myInterests = new Set(me.interests ?? []);
  const theirInterests = new Set(other.interests ?? []);
  let overlap = 0;
  for (const i of theirInterests) {
    if (myInterests.has(i)) overlap += 1;
  }
  const interestScore = myInterests.size === 0 && theirInterests.size === 0 ? 40 : Math.min(100, overlap * 18 + 35);

  const myLang = new Set(me.languages ?? []);
  const theirLang = new Set(other.languages ?? []);
  let langOverlap = 0;
  for (const l of theirLang) {
    if (myLang.has(l)) langOverlap += 1;
  }
  const langScore = myLang.size === 0 && theirLang.size === 0 ? 30 : Math.min(100, langOverlap * 22 + 25);

  const cityBoost =
    me.city && other.city && me.city.trim().toLowerCase() === other.city.trim().toLowerCase() ? 12 : 0;

  const last = other.lastActive ? Date.parse(other.lastActive) : 0;
  const hours = last ? (Date.now() - last) / 36e5 : 999;
  const recency = hours < 24 ? 8 : hours < 72 ? 4 : 0;

  const raw = interestScore * 0.55 + langScore * 0.35 + cityBoost + recency;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
