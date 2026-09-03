export const CRM_SESSION_COOKIE = "crmSession";

const encoder = new TextEncoder();

function getSessionSecret(): string | null {
  const secret = process.env.CRM_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

async function hmacHex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeHexEquals(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifySessionValueForEdge(value?: string): Promise<boolean> {
  const secret = getSessionSecret();
  if (!value || !secret) return false;

  const [issuedAt, signature, ...extra] = value.split(".");
  if (!issuedAt || !signature || extra.length > 0) return false;

  const issued = Number(issuedAt);
  const maxAgeMs = 1000 * 60 * 60 * 12;
  const now = Date.now();
  if (!Number.isFinite(issued) || now < issued || now - issued > maxAgeMs) return false;

  const expected = await hmacHex(issuedAt, secret);
  return timingSafeHexEquals(signature, expected);
}
