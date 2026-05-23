import { ForgotForm } from "./form";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Enter your email and we'll send you a link to set a new password.
        </p>
      </div>
      <ForgotForm />
    </div>
  );
}
