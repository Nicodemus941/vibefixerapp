import { ResetForm } from "./form";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Choose something you'll remember. Minimum 6 characters.
        </p>
      </div>
      <ResetForm />
    </div>
  );
}
