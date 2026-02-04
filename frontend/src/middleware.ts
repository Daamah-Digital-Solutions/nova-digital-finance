import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/about",
  "/how-it-works",
  "/features",
  "/faq",
  "/terms",
  "/privacy",
  "/risk-disclosure",
  "/contact",
  "/partnership",
  "/documents/verify",
];

const authPaths = ["/login", "/register", "/forgot-password", "/verify-email"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for access token in cookies or let client-side handle it
  // Since we use localStorage for tokens, middleware just does basic routing
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  // For now, allow all routes and handle auth client-side
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
