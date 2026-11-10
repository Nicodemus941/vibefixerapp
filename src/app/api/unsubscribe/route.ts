import { NextResponse } from "next/server";
import { unsubscribeWithToken } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";

// RFC 8058 one click unsubscribe target (List-Unsubscribe-Post). Mail
// providers POST "List-Unsubscribe=One-Click" here. GET only redirects
// to the confirm page, so link scanners cannot unsubscribe anyone.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t");
  const ok = await unsubscribeWithToken(token);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL("/unsubscribe", url);
  const t = url.searchParams.get("t");
  if (t) target.searchParams.set("t", t);
  return NextResponse.redirect(target);
}
