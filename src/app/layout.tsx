import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Loop · The free network for people who build",
    template: "%s",
  },
  description:
    "Loop is a free professional network for founders and builders. Say what you need and what you offer, see your matches every day, and agree on the deal in your inbox. Loop takes no fee.",
  metadataBase: new URL("https://loopfounders.com"),
  alternates: { canonical: "/" },
  keywords: [
    "founder network",
    "linkedin alternative for founders",
    "founder community",
    "hire freelance founder",
    "fractional cmo cfo",
    "startup services marketplace",
  ],
  // icon.png, apple-icon.png and manifest.ts in src/app are picked up
  // automatically by the App Router file conventions.
  openGraph: {
    title: "Loop · Real work. Real deals. No noise.",
    description:
      "The free professional network for people who build. Say what you need and what you offer, and meet the people who fit.",
    url: "https://loopfounders.com",
    siteName: "Loop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Loop: Real work. Real deals. No noise. The free professional network for people who build.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loop · Real work. Real deals. No noise.",
    description: "The free professional network for people who build.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1412" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
