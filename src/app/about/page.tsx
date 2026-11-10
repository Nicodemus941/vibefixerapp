import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "About Loop",
  description:
    "Loop is a free professional network for founders and builders, built around real work and real deals.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalPage title="About Loop">
      <p className="text-[19px] text-[var(--fg)]">
        Loop is a free professional network for people who build. Real
        work. Real deals. No noise.
      </p>
      <p>
        Most networks reward posting. Loop is built around what you can do
        for each other: every member lists what they offer and what they
        need, and Loop matches the two sides every day with a plain reason
        for each match.
      </p>
      <p>
        Your profile shows the receipts: experience, education, the work you
        offer, deals closed and reviews from the people you worked with.
        Deals are agreed in your inbox, and Loop takes no fee.
      </p>
      <p>Loop is operated by Platform, LLC.</p>
      <p>
        <Link href="/login">Join free</Link>
      </p>
    </LegalPage>
  );
}
