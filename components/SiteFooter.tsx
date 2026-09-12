import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 flex flex-col gap-3 border-t border-arc-line py-6 text-sm font-semibold text-arc-muted sm:flex-row sm:items-center sm:justify-between">
      <p>Creator Settlement · Arc Testnet</p>
      <nav aria-label="Trust and project links" className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link href="/security" className="transition-colors hover:text-arc-ink">Security &amp; Trust</Link>
        <a href="https://github.com/3624341/arc-creator-settlement" target="_blank" rel="noreferrer" className="transition-colors hover:text-arc-ink">GitHub ↗</a>
      </nav>
    </footer>
  );
}
