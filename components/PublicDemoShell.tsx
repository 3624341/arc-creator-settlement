import Link from "next/link";
import type { DemoLocale } from "@/lib/reviewer-demo";

export function PublicDemoShell({
  locale,
  children
}: {
  locale: DemoLocale;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(177,255,43,0.13),transparent_31%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_30%),#f7f5ef] text-arc-ink">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-arc-line bg-white/85 px-5 py-4 shadow-sm backdrop-blur">
          <Link href="/" className="flex items-center gap-3 font-black tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-arc-ink text-white" aria-hidden="true">A</span>
            <span>Arc Creator Settlement</span>
          </Link>

          <nav aria-label="Reviewer demo navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold">
            <Link href="/" className="hover:text-arc-purple">Product</Link>
            <Link href="/demo" className="text-arc-purple">Reviewer Demo</Link>
            <Link href="/security" className="hover:text-arc-purple">Security</Link>
            <a
              href="https://github.com/3624341/arc-creator-settlement"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-arc-purple"
            >
              GitHub ↗
            </a>
          </nav>

          <nav aria-label="Language" className="flex rounded-full border border-arc-line bg-white p-1 text-sm font-black">
            <Link
              href="/demo"
              aria-current={locale === "en" ? "page" : undefined}
              className={locale === "en" ? "rounded-full bg-arc-ink px-3 py-2 text-white" : "rounded-full px-3 py-2"}
            >
              English
            </Link>
            <Link
              href="/demo?lang=ko"
              aria-current={locale === "ko" ? "page" : undefined}
              className={locale === "ko" ? "rounded-full bg-arc-ink px-3 py-2 text-white" : "rounded-full px-3 py-2"}
            >
              한국어
            </Link>
          </nav>
        </header>

        {children}

        <footer className="mt-10 flex flex-col gap-2 border-t border-arc-line py-6 text-sm font-semibold text-arc-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Read-only Arc Testnet evidence · No wallet required</p>
          <p>Creator Settlement · Testnet demonstration</p>
        </footer>
      </div>
    </main>
  );
}
