import type { Metadata } from "next";
import { LegalPage, TodoContact } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | Loop",
  description: "The terms for using Loop, a free network for founders and builders.",
  alternates: { canonical: "/terms" },
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 10, 2026" draft>
      <p>
        Loop is a free professional network for founders and builders. Loop
        is operated by <strong>Platform, LLC</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;). By creating an account or using Loop you agree to
        these terms.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 18 years old and able to enter a contract.</li>
        <li>Give accurate information about who you are and what you offer.</li>
        <li>You are responsible for activity on your account. Keep your email secure.</li>
      </ul>

      <h2>Loop is free</h2>
      <p>
        Loop does not charge members to use the network and takes no fee on
        deals you agree with other members. If that ever changes we will tell
        you in advance and you can leave before any change applies to you.
      </p>

      <h2>Deals between members</h2>
      <p>
        Agreements you make with other members are between you and them.
        Loop is not a party to those agreements and does not guarantee the
        quality, safety or legality of any work, offer or payment. Where a
        payment provider processes a payment, that provider&apos;s terms
        also apply.
      </p>

      <h2>What you post</h2>
      <ul>
        <li>You keep ownership of what you post.</li>
        <li>
          You give Loop permission to host, display and share your content
          inside the service so it works as intended (for example, showing
          your profile and posts to other members).
        </li>
        <li>
          Do not post anything unlawful, misleading, hateful, harassing, or
          that infringes someone else&apos;s rights. No spam and no scraping.
        </li>
      </ul>

      <h2>Moderation and ending your account</h2>
      <p>
        We may remove content or suspend accounts that break these terms. You
        can delete your account at any time from your account settings.
      </p>

      <h2>No warranty</h2>
      <p>
        Loop is provided as is. To the extent the law allows, we are not
        liable for indirect or consequential losses arising from your use of
        Loop or from dealings with other members.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. When we make a material change we will
        let you know on Loop or by email.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <TodoContact />
      </p>
    </LegalPage>
  );
}
