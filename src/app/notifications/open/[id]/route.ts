import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificationHref } from "@/lib/notification-kinds";

// Opening a notification (from the notifications page or an email) marks
// it read and redirects to where it points. The destination comes from
// the stored row, never from the URL, so this is not an open redirect.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `/notifications/open/${id}`);
    return NextResponse.redirect(login);
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.redirect(new URL("/notifications", request.url));
  }

  const { data: note } = await supabase
    .from("notifications")
    .select("id, kind, actor_id, related_post_id, related_conversation_id, payload, read_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!note) return NextResponse.redirect(new URL("/notifications", request.url));

  if (!note.read_at) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
  }

  const href = notificationHref(
    {
      kind: note.kind,
      actor_id: note.actor_id,
      actor_name: null,
      related_post_id: note.related_post_id,
      related_conversation_id: note.related_conversation_id,
      payload: (note.payload as Record<string, unknown> | null) ?? null,
    },
    user.id,
  );
  return NextResponse.redirect(new URL(href, request.url));
}
