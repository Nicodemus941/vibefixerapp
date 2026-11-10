import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseOtpType, resolveAuthRedirect } from "@/lib/auth-flow";

// Lands every auth email link:
//   * ?token_hash=...&type=signup|magiclink|email|recovery|...  (the
//     branded templates in supabase/templates use this; it works even
//     when the link is opened on another device)
//   * ?code=...  (the default PKCE links, same browser only)
// type=recovery always goes to /reset-password.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const destination = resolveAuthRedirect({ type, next: url.searchParams.get("next") });

  const supabase = await createClient();

  if (tokenHash) {
    const otpType = parseOtpType(type);
    if (!otpType) {
      return NextResponse.redirect(new URL("/login?error=missing_code", url));
    }
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
    if (error) {
      const target = otpType === "recovery" ? "/forgot-password?error=link_expired" : "/login?error=link_expired";
      return NextResponse.redirect(new URL(target, url));
    }
    return NextResponse.redirect(new URL(destination, url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const target = type === "recovery" ? "/forgot-password?error=link_expired" : "/login?error=link_expired";
    return NextResponse.redirect(new URL(target, url));
  }

  // The middleware sends signed in members on to the right place.
  return NextResponse.redirect(new URL(destination, url));
}
