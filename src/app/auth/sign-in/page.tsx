import { Suspense } from "react";
import { SignInForm } from "./form";

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Sign in to AK Rooster
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Save cars, message verified sellers, and post listings free.
        </p>
      </div>
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
