import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AK Rooster — Buy & sell cars without the noise",
  description:
    "A modern car marketplace built around verified sellers, clean search, and transparent deal pricing. Cleaner than AutoTrader.",
  metadataBase: new URL("https://akrooster.com"),
  openGraph: {
    title: "AK Rooster",
    description:
      "A modern car marketplace built around verified sellers, clean search, and transparent deal pricing.",
    url: "https://akrooster.com",
    siteName: "AK Rooster",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
