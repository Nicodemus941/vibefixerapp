import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  "/unsubscribe",
  "/jobs",
  "/discover",
  "/about",
  "/terms",
  "/privacy",
  "/manifest.webmanifest",
  "/sitemap.xml",
  "/robots.txt",
]);

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  // Cron senders check CRON_SECRET themselves; unsubscribe checks a signed token.
  if (pathname.startsWith("/api/cron/")) return true;
  if (pathname === "/api/unsubscribe") return true;
  if (pathname.startsWith("/email/")) return true;
  if (pathname.startsWith("/jobs/") && !pathname.startsWith("/jobs/new")) return true;
  if (pathname.startsWith("/o/")) return true;
  // Public business cards — designed as the shareable identity. The
  // full /u/[userId] profile remains auth-gated; /c/[userId] exposes
  // only the curated subset.
  if (pathname.startsWith("/c/")) return true;
  // Post permalinks: signed out visitors get a teaser + OG tags for link
  // unfurls; the post itself only renders for signed in members.
  if (pathname.startsWith("/p/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    if (user && (pathname === "/login" || pathname === "/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/feed";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Email verification is required. With "Confirm email" on, Supabase
  // never hands out a session before verification, so this only catches
  // older or edge case sessions: sign them out and ask them to verify.
  if (!user.email_confirmed_at) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", "verify");
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  // Onboarding is now optional: users land directly on /feed and can choose
  // to complete it for personalized matching. Only redirect already-finished
  // users away from /onboarding (so they don't see it again).
  if (pathname.startsWith("/onboarding")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.onboarding_complete === true) {
      const url = request.nextUrl.clone();
      url.pathname = "/feed";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
