import Link from "next/link";
import { RoosterLogo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <RoosterLogo className="h-8 w-8" />
            <span className="font-bold">AK Rooster</span>
          </div>
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
            Buy and sell cars without the noise. Verified sellers, clear deals,
            no surprise fees.
          </p>
        </div>
        <FooterCol
          title="Buy"
          links={[
            ["Browse all cars", "/search"],
            ["Used SUVs", "/search?body=SUV"],
            ["Used Trucks", "/search?body=Truck"],
            ["Under $15,000", "/search?priceMax=15000"],
          ]}
        />
        <FooterCol
          title="Sell"
          links={[
            ["List a car", "/sell"],
            ["Why AK Rooster", "/#why"],
            ["Seller dashboard", "/account"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["About", "/#why"],
            ["Trust & safety", "/#trust"],
            ["Contact", "mailto:hello@akrooster.com"],
          ]}
        />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-[var(--color-ink-muted)]">
          <span>© {new Date().getFullYear()} AK Rooster</span>
          <span>Made for buyers and sellers who hate ad clutter.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-[var(--color-ink-muted)]">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-[var(--color-brand)]">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
