import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
});

export const metadata: Metadata = {
  title:
    "Elite Medical Concierge | Orlando & Winter Park's #1 Concierge Doctors",
  description:
    "Skip the waiting room. Same-day visits with Dr. Monica & Dr. Richard Sher — board-certified physicians. Direct phone access 7 days a week. In-home visits across Maitland, Winter Park & Orlando. Membership from $500/mo. Cancel anytime.",
  keywords: [
    "concierge doctor orlando",
    "concierge medicine maitland",
    "winter park doctor",
    "in-home doctor visit florida",
    "hormone therapy orlando",
    "functional medicine winter park",
    "executive physical orlando",
    "weight loss clinic maitland",
    "stem cell therapy orlando",
    "Accufit body contouring",
    "Dr Monica Sher",
    "Dr Richard Sher",
  ],
  openGraph: {
    title: "Elite Medical Concierge — Your Doctor. On Demand.",
    description:
      "Direct phone access to your physician, 7 days a week. Same-day visits. No insurance games. Central Florida's husband-and-wife concierge practice.",
    type: "website",
    locale: "en_US",
    url: "https://www.flelitemedical.com",
    siteName: "Elite Medical Concierge",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elite Medical Concierge — Your Doctor. On Demand.",
    description:
      "Direct phone access to a real physician — 7 days a week. Same-day visits. Maitland · Winter Park · Orlando.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
