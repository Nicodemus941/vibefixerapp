import type { Metadata } from "next";
import { LegalPage, TodoContact } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Loop",
  description: "How Loop handles your information.",
  alternates: { canonical: "/privacy" },
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 10, 2026" draft>
      <p>
        Loop is a free professional network for founders and builders,
        operated by <strong>Platform, LLC</strong>. This page explains what
        information we collect, why, and the choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> such as your email address and,
          if you sign in with GitHub, your basic GitHub profile.
        </li>
        <li>
          <strong>Profile content</strong> you choose to add: name, headline,
          photo, cover image, experience, education, offers, needs, posts,
          messages and reviews.
        </li>
        <li>
          <strong>Usage information</strong> such as pages visited and basic
          device and log data, used to run and secure the service.
        </li>
        <li>
          <strong>Payment information</strong> is handled by our payment
          provider. Loop does not store full card numbers.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run Loop: show your profile, deliver messages, and suggest matches.</li>
        <li>To keep Loop safe: prevent spam, abuse and fraud.</li>
        <li>To contact you about your account and activity you asked to hear about.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Who can see what</h2>
      <p>
        Your profile, posts and public business card are visible to other
        members, and some parts (such as your public card) are visible to
        anyone with the link. Messages are visible to the people in the
        conversation.
      </p>

      <h2>Service providers</h2>
      <p>
        We use trusted providers for hosting, database, email, payments and
        AI features that help with matching. They process data on our behalf
        and only as needed to provide those services.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Edit or remove your profile content at any time.</li>
        <li>Export your data or delete your account from account settings.</li>
        <li>Change which notifications you receive.</li>
      </ul>

      <h2>Changes</h2>
      <p>
        We may update this policy. When we make a material change we will
        let you know on Loop or by email.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions: <TodoContact />
      </p>
    </LegalPage>
  );
}
