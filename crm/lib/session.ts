import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const CRM_SESSION_COOKIE = "crmSession";

function getSessionSecret(): string {
  const secret = process.env.CRM_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("CRM_SESSION_SECRET is required and must be at least 32 characters");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function createSessionValue() {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  return `${issuedAt}.${signature}`;
}

export function verifySessionValue(value?: string): boolean {
  try {
    if (!value) return false;

    const parts = value.split(".");
    if (parts.length !== 2) return false;

    const [issuedAt, signature] = parts;
    if (!issuedAt || !signature) return false;

    const issued = Number(issuedAt);
    if (!Number.isFinite(issued)) return false;

    // Maximum 12 hours session validity
    const maxAgeMs = 1000 * 60 * 60 * 12;
    const now = Date.now();
    if (now < issued || now - issued > maxAgeMs) return false;

    const expected = sign(issuedAt);
    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (sigBuffer.length !== expectedBuffer.length) return false;

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export function setSessionCookie(response: NextResponse) {
  response.cookies.set(CRM_SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(CRM_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 0,
  });
}

export function isAuthedRequest(request: NextRequest): boolean {
  const session = request.cookies.get(CRM_SESSION_COOKIE)?.value;
  return verifySessionValue(session);
}

export async function isAuthedServer(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(CRM_SESSION_COOKIE)?.value;
  return verifySessionValue(session);
}
