export function VerifyBanner({ verified }: { verified: boolean }) {
  if (verified) return null;
  return (
    <div className="ak-card mt-4 flex flex-col items-start gap-3 border-[var(--color-warn)] bg-[var(--color-warn-soft)] p-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--color-warn)]">
          Verify your account to unlock listing
        </p>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Verified sellers get a ✓ badge on every listing, 3× more messages,
          and bypass scam-flag holds on payments.
        </p>
      </div>
      <a
        href="mailto:trust@carworldusa.com?subject=Verify my account"
        className="ak-btn ak-btn-primary whitespace-nowrap"
      >
        Start verification →
      </a>
    </div>
  );
}
