/**
 * Canonical avatar resolver matching the Friendoo App.
 * Maps authentic app avatar preset IDs (e.g. 'user_01'..'user_10', 'host_01'..'host_10')
 * to the exact local bundled assets (/avatars/avatar_user_01.jpg, etc.).
 *
 * If no valid app avatar exists, returns null so the UI can render clean initials
 * without injecting fake third-party dicebear graphics.
 */
export function getAppAvatarUrl(presetOrPath?: string | null): string | null {
  if (!presetOrPath) return null;
  const raw = String(presetOrPath).trim();
  if (!raw) return null;

  if (raw.startsWith('/avatars/')) {
    return raw;
  }

  // Normalize preset ID (e.g. 'assets/avatars/avatar_user_01.jpg', 'avatar_user_01', 'user_01')
  const clean = raw
    .replace(/^assets\/avatars\//, '')
    .replace(/^avatars\//, '')
    .replace(/\.jpg$/, '')
    .replace(/\.png$/, '')
    .replace(/^avatar_/, '')
    .trim();

  // Known app preset mappings: user_01..10, host_01..10
  if (/^(user|host)_(0[1-9]|10)$/.test(clean)) {
    return `/avatars/avatar_${clean}.jpg`;
  }

  return null;
}

/**
 * Backward compatibility alias for existing callers:
 * Strictly returns only authentic app avatars, never external dicebear avatars.
 */
export function getAvatarUrl(seedOrPath: string, _size: number = 128): string {
  const resolved = getAppAvatarUrl(seedOrPath);
  return resolved || '';
}
