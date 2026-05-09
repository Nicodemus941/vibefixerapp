import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "./config";
import StickyCTA from "./components/StickyCTA";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fastfamilyautoglass.com"),
  title: {
    default: `${BUSINESS.name} · Mobile Windshield Repair & Replacement in ${BUSINESS.city}`,
    template: `%s · ${BUSINESS.name}`,
  },
  description: `Family-owned mobile auto glass in ${BUSINESS.city}. We come to you — same-day repairs, next-day replacements, and we handle your insurance claim. Call ${BUSINESS.phoneDisplay}.`,
  openGraph: {
    title: `${BUSINESS.name} · Mobile Windshield Repair`,
    description: `Mobile windshield repair & replacement that comes to you. Family-owned · ${BUSINESS.city}.`,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1f3a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
        <StickyCTA />
      </body>
    </html>
  );
}
