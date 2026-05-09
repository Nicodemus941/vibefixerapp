import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isAuthDisabled, verifyToken } from "./app/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  // Login route is always accessible.
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  // No password set → preview mode, dashboard is open.
  if (isAuthDisabled()) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const ok = await verifyToken(cookie);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
