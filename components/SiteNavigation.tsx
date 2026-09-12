import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contracts/create", label: "Create Contract" },
  { href: "/profile", label: "My Page" },
  { href: "/demo", label: "Reviewer Demo" },
];

export function SiteNavigation({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  const linkClass = (href: string) => mobile
    ? `rounded-xl px-4 py-3 hover:bg-arc-bg ${pathname === href ? "bg-arc-lime text-arc-ink" : "text-arc-ink"}`
    : `rounded-xl px-3 py-2 transition-colors ${pathname === href ? "bg-arc-lime text-arc-ink" : "bg-arc-bg/70 text-arc-ink hover:bg-white"}`;

  return (
    <>
      {primaryNavigation.map((item) => (
        <Link key={item.href} href={item.href} className={linkClass(item.href)}>{item.label}</Link>
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
