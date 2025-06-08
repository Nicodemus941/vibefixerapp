"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="w-full flex justify-between items-center py-4 px-6 border-b border-gray-200 mb-6">
      <div className="font-bold text-lg tracking-tight">Code Vibe Fixer</div>
      <div>
        {status === "loading" ? (
          <span>Loading...</span>
        ) : session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">Signed in as {session.user?.name || session.user?.email}</span>
            <button
              className="bg-gray-900 text-white px-4 py-1 rounded hover:bg-gray-700 transition"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-500 transition"
            onClick={() => signIn("github")}
          >
            Sign in with GitHub
          </button>
        )}
      </div>
    </header>
  );
} 