import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/health",
  "/api/integrations/whatsapp/webhook",
];

const STATIC_PATHS = ["/_next", "/favicon.ico", "/images", "/fonts"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const session_cookie = request.cookies.get("nfloor_session");

  if (!session_cookie?.value) {
    const login_url = new URL("/login", request.url);
    login_url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login_url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
