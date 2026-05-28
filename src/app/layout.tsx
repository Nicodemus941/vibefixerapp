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
    default: "Loop — A reciprocal marketplace for founders",
    template: "%s",
  },
  description:
    "A founder-only marketplace where every member has to give as well as get. Post a need, get matched to another founder who delivers it, with escrow-protected contracts and reputation that comes from shipped work.",
  metadataBase: new URL("https://loopfounders.com"),
  alternates: { canonical: "/" },
  keywords: [
    "founder marketplace",
    "hire freelance founder",
    "founder community",
    "alternative to upwork",
    "freelance escrow contract",
    "fractional cmo cfo",
    "startup services marketplace",
  ],
  icons: {
    icon: [
      { url: "/loop-mark.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Loop — Stop networking. Start building.",
    description:
      "The first platform where every founder must give AND receive. AI matches your needs to another founder's services in under 24 hours.",
    url: "https://loopfounders.com",
    siteName: "Loop",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Loop" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loop — Stop networking. Start building.",
    description:
      "Reciprocal founder marketplace. AI matches your needs to another founder's services in under 24 hours.",
    images: ["/og-image.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
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
