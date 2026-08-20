import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const CRM_SESSION_COOKIE = "crmSession";

const SESSION_SECRET =
  process.env.CRM_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "friendoo-crm-change-me";

function sign(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function createSessionValue() {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  return `${issuedAt}.${signature}`;
}

export function verifySessionValue(value?: string) {
  if (!value) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;

  const expected = sign(issuedAt);
  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (sigBuffer.length !== expectedBuffer.length) return false;

  const valid = timingSafeEqual(sigBuffer, expectedBuffer);
  if (!valid) return false;

  const issued = Number(issuedAt);
  if (!Number.isFinite(issued)) return false;

  const maxAgeMs = 1000 * 60 * 60 * 12;
  return Date.now() - issued <= maxAgeMs;
}

export function setSessionCookie(response: NextResponse) {
  response.cookies.set(CRM_SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(CRM_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function isAuthedRequest(request: NextRequest) {
  const session = request.cookies.get(CRM_SESSION_COOKIE)?.value;
  return verifySessionValue(session);
}

export function isAuthedServer() {
  const session = cookies().get(CRM_SESSION_COOKIE)?.value;
  return verifySessionValue(session);
}
