import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/account";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/sign-in?err=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error: exchErr } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchErr) {
      return NextResponse.redirect(
        `${origin}/auth/sign-in?err=${encodeURIComponent(exchErr.message)}`,
      );
    }
  } else if (token_hash && type) {
    const { error: vErr } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "recovery" | "invite" | "signup" | "email_change",
    });
    if (vErr) {
      return NextResponse.redirect(
        `${origin}/auth/sign-in?err=${encodeURIComponent(vErr.message)}`,
      );
    }
  }

  const dest = next.startsWith("/") ? next : "/account";
  return NextResponse.redirect(`${origin}${dest}?welcome=1`);
}
