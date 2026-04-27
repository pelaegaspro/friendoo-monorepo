import { NextRequest, NextResponse } from "next/server";
import { isAuthedRequest } from "@/lib/session";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function requireCrmAuth(request: NextRequest) {
  if (!isAuthedRequest(request)) {
    return unauthorizedResponse();
  }
  return null;
}

export async function parseJsonBody<T>(request: NextRequest): Promise<T> {
  return (await request.json()) as T;
}
