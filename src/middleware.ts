import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";

const PUBLIC_PATHS = new Set(["/", "/login", "/auth/callback"]);

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/api/auth")) return true;
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

  // Onboarding gate: force users into /onboarding until they finish.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  const onboardingDone = profile?.onboarding_complete === true;
  const onOnboarding = pathname.startsWith("/onboarding");

  if (!onboardingDone && !onOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (onboardingDone && onOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
