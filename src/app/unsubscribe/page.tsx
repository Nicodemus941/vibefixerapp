import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoopMark } from "@/components/LoopMark";
import { unsubscribeWithToken } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

async function confirmUnsubscribe(formData: FormData) {
  "use server";
  const t = String(formData.get("t") ?? "");
  const ok = await unsubscribeWithToken(t);
  redirect(ok ? "/unsubscribe?done=1" : "/unsubscribe?bad=1");
}

// Opening the email link shows this page; the button does the work, so a
// mail scanner that follows links does not unsubscribe anyone.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; done?: string; bad?: string }>;
}) {
  const sp = await searchParams;
  const done = sp.done === "1";
  const bad = sp.bad === "1" || (!done && !sp.t);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--fg)] px-4 py-10">
      <Link href="/" aria-label="Loop home" className="mb-6 inline-flex min-h-11 items-center gap-2 text-xl font-bold tracking-[-0.02em] rounded-lg">
        <LoopMark size={30} />
        Loop
      </Link>
      <div className="surface-card w-full max-w-sm p-6 sm:p-8">
        {done ? (
          <>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.025em]">You are unsubscribed</h1>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Loop will not send you notification emails. You will still see everything when you open Loop.
              Changed your mind? Turn emails back on in your settings.
            </p>
          </>
        ) : bad ? (
          <>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.025em]">That link did not work</h1>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Sign in and choose what we email you in your settings instead.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[24px] font-bold leading-tight tracking-[-0.025em]">Unsubscribe from Loop emails?</h1>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              This stops every notification email. You can pick just the ones you want in your settings instead.
            </p>
            <form action={confirmUnsubscribe} className="mt-6">
              <input type="hidden" name="t" value={sp.t} />
              <button
                type="submit"
                className="press-shrink inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
              >
                Unsubscribe
              </button>
            </form>
          </>
        )}
        <Link
          href="/account#notifications"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-text)] hover:underline"
        >
          Open notification settings
        </Link>
      </div>
    </main>
  );
}
