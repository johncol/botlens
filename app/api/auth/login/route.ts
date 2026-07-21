import { NextRequest, NextResponse } from "next/server";
import { deriveToken, verifyToken, AUTH_COOKIE } from "@/lib/auth";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const gatePassword = process.env.GATE_PASSWORD;
  if (!gatePassword) {
    // No password configured — auth is disabled, always succeed
    return NextResponse.json({ ok: true });
  }

  const supplied = body.password ?? "";
  // Derive the token from the supplied password and verify it against the gate
  // password using HMAC verify — constant-time, no string === shortcut.
  const suppliedToken = await deriveToken(supplied);
  const match = await verifyToken(gatePassword, suppliedToken);

  if (!match) {
    // Slow down brute-force attempts with a minimum response delay.
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await deriveToken(gatePassword);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: THIRTY_DAYS,
    path: "/",
  });
  return response;
}
