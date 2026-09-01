import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Creator Settlement — Verifiable USDC milestone payments",
  description: "Create milestone escrows, release USDC on Arc, and share public onchain settlement receipts."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
