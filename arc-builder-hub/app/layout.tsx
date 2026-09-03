import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Builder Hub",
  description: "Build, ship, and verify on Arc.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">Arc Builder Hub</a>
          <span className="network-label">Arc Testnet · 5042002</span>
        </header>
        {children}
      </body>
    </html>
  );
}
