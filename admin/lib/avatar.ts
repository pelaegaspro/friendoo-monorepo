/**
 * Canonical avatar URL builder for admin surfaces.
 * Matches the exact formula used in Android and web apps.
 * Style is hardcoded to 'open-peeps' — no user-selectable styles.
 */
export function getAvatarUrl(seed: string, size: number = 128): string {
  return `https://api.dicebear.com/9.x/open-peeps/png?seed=${encodeURIComponent(seed)}&size=${size}`;
}
