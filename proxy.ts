import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";
import { GATE_PASSWORD } from "@/lib/config";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow the login page and its API route through
  if (pathname === "/login" || pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  // If no password is configured, allow everything (local dev)
  const password = GATE_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value ?? "";
  if (await verifyToken(password, token)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
