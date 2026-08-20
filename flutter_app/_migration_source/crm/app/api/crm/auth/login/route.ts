import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/app/api/crm/_utils";
import { setSessionCookie } from "@/lib/session";

interface LoginBody {
  password?: string;
}

function safeCompare(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<LoginBody>(request);
  const password = body.password ?? "";
  const expected = process.env.ADMIN_PASSWORD ?? "";

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 500 },
    );
  }

  if (!safeCompare(password, expected)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setSessionCookie(response);
  return response;
}
