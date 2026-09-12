import type { Metadata } from "next";
import { PublicDemoShell } from "@/components/PublicDemoShell";
import { ReviewerDemo } from "@/components/ReviewerDemo";
import { loadReviewerDemo, resolveDemoLocale } from "@/lib/reviewer-demo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "90-second reviewer demo · Arc Creator Settlement",
  description: "A wallet-free, read-only walkthrough with live Arc Testnet verification when available."
};

type DemoPageProps = {
  searchParams: Promise<{ lang?: string | string[] }>;
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const locale = resolveDemoLocale((await searchParams).lang);
  const view = await loadReviewerDemo(locale);

  return (
    <PublicDemoShell locale={locale}>
      <ReviewerDemo view={view} />
    </PublicDemoShell>
  );
}
