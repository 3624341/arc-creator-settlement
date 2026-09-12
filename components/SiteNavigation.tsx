import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contracts/create", label: "Create Contract" },
  { href: "/profile", label: "My Page" },
  { href: "/demo", label: "Reviewer Demo" },
];

export function SiteNavigation({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  const isActive = (href: string) => pathname === href || (href === "/profile" && pathname.startsWith("/profile/"));
  const linkClass = (href: string) => mobile
    ? `rounded-xl px-4 py-3 hover:bg-arc-bg ${isActive(href) ? "bg-arc-lime text-arc-ink" : "text-arc-ink"}`
    : `rounded-xl px-3 py-2 transition-colors ${isActive(href) ? "bg-arc-lime text-arc-ink" : "bg-arc-bg/70 text-arc-ink hover:bg-white"}`;

  return (
    <>
      {primaryNavigation.map((item) => (
        <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={linkClass(item.href)}>{item.label}</Link>
      ))}
      <a
        href="https://testnet.arcscan.app"
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-1 rounded-xl hover:bg-white ${mobile ? "px-4 py-3 hover:bg-arc-bg" : "px-3 py-2"}`}
      >
        ArcScan <ArrowUpRight size={15} />
      </a>
    </>
  );
}

export function MobileNavigationPanel({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  return (
    <div className="absolute left-4 right-4 top-[4.75rem] grid gap-2 rounded-2xl border border-arc-line bg-white p-3 text-sm font-black shadow-xl">
      <nav aria-label="Primary navigation" className="grid gap-2">
        <SiteNavigation pathname={pathname} mobile />
      </nav>
      <section aria-label="Wallet" className="mt-1 border-t border-arc-line pt-2">
        {children}
      </section>
    </div>
  );
}
