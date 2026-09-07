import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Builder Hub",
  description: "Explore Creator Settlement, inspect a recorded Arc Testnet payment, and follow the Korean build guide. Built by Dongkyun Seo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <a href="/" className="brand"><span className="brand-mark" aria-hidden="true">A</span>ARC <span>BUILDER HUB</span></a>
          <nav aria-label="Main navigation"><a href="#projects">Projects</a><a href="#evidence">Evidence</a><a href="#guide">Guide</a><a href="#updates">Updates</a></nav>
          <span className="network-label"><span className="status-dot" /> Arc Testnet</span>
        </header>
        {children}
      </body>
    </html>
  );
}
