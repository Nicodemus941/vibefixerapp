import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JV Credit Repair — Command Center",
  description:
    "Faith-Driven. Results-Focused. AI-powered credit repair CRM: report analysis, atomic dispute letters, goal game plans, client portal, and automations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
