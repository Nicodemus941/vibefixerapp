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
  title: "Loop — Stop networking. Start building.",
  description:
    "The first platform where every founder must give AND receive. AI matches your needs to another founder's services in under 24 hours.",
  metadataBase: new URL("https://loopfounders.com"),
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
