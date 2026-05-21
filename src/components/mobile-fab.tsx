"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Mobile-only floating "+ List a car" affordance. Hidden on the pages
// where it would compete with primary CTAs (sell, sign-in, the seller
// dashboard which already has its own action bar).
const HIDDEN_ON = ["/sell", "/auth", "/account/profile"];

export function MobileFab() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <Link
      href="/sell"
      aria-label="List a car"
      className="ak-btn ak-btn-primary fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg md:hidden"
    >
      +
    </Link>
  );
}
