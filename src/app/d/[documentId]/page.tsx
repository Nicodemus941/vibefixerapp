import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { fetchDocument } from "@/app/documents/actions";
import { DocumentEditor } from "./_components/DocumentEditor";

export const dynamic = "force-dynamic";

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  if (!UUID_RX.test(documentId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/d/${documentId}`);

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { doc, signatures, error } = await fetchDocument(documentId);

  if (!doc) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <FeedHeader
          displayName={viewerProfile?.display_name ?? "founder"}
          role={viewerProfile?.role ?? "user"}
        />
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
          <p className="text-[var(--fg-muted)]">{error ?? "Document not found."}</p>
          <Link
            href="/inbox"
            className="press-shrink mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to inbox
          </Link>
        </main>
      </div>
    );
  }

  // Resolve both party names to render template placeholders nicely.
  const { data: parties } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", [doc.creator_id, doc.counterparty_id]);
  const nameMap = new Map((parties ?? []).map((p) => [p.id, p.display_name]));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={viewerProfile?.display_name ?? "founder"}
        role={viewerProfile?.role ?? "user"}
      />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <Link
          href={`/inbox/${doc.conversation_id}`}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to conversation
        </Link>

        <DocumentEditor
          doc={doc}
          signatures={signatures}
          viewerId={user.id}
          creatorName={nameMap.get(doc.creator_id) ?? "Party A"}
          counterpartyName={nameMap.get(doc.counterparty_id) ?? "Party B"}
        />
      </main>
    </div>
  );
}
