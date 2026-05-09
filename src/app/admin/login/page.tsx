import type { Metadata } from "next";
import { Suspense } from "react";
import Logo from "../../components/Logo";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-spotlight p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-pop">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="headline mt-6 text-center text-2xl font-extrabold">
          Ops cockpit
        </h1>
        <p className="mt-1 text-center text-sm text-ink-muted">
          Family only. Same password for Eric, Kyle, Damian.
        </p>
        <div className="mt-6">
          <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-bone" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
