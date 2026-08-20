import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/app/api/crm/_utils";
import { setSessionCookie } from "@/lib/session";

interface LoginBody {
  password?: string;
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<LoginBody>(request);
  const password = (body.password ?? "").trim();
  const configuredPassword = (process.env.ADMIN_PASSWORD ?? "").trim();

  // If no admin password is configured in environment, disallow login
  if (!configuredPassword || !password) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const passBuffer = Buffer.from(password, "utf8");
  const configuredBuffer = Buffer.from(configuredPassword, "utf8");

  if (
    passBuffer.length !== configuredBuffer.length ||
    !timingSafeEqual(passBuffer, configuredBuffer)
  ) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  setSessionCookie(response);
  return response;
}
