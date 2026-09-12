import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

test("primary navigation keeps only product actions and reviewer evidence", async () => {
  const navigationModule = await import("../components/SiteNavigation").catch(() => ({}));

  assert.equal(
    typeof (navigationModule as { SiteNavigation?: unknown }).SiteNavigation,
    "function",
    "SiteNavigation should expose the primary product navigation"
  );

  const { SiteNavigation } = navigationModule as {
    SiteNavigation: (props: { pathname: string; mobile?: boolean }) => React.ReactNode;
  };
  const html = renderToStaticMarkup(<SiteNavigation pathname="/dashboard" />);

  assert.match(html, /Dashboard/);
  assert.match(html, /Create Contract/);
  assert.match(html, /My Page/);
  assert.match(html, /Reviewer Demo/);
  assert.match(html, /ArcScan/);
  assert.doesNotMatch(html, /Circle Wallet/);
  assert.doesNotMatch(html, />Security</);
});

test("security remains available from the site footer", async () => {
  const footerModule = await import("../components/SiteFooter").catch(() => ({}));

  assert.equal(
    typeof (footerModule as { SiteFooter?: unknown }).SiteFooter,
    "function",
    "SiteFooter should expose trust information outside the primary navigation"
  );

  const { SiteFooter } = footerModule as { SiteFooter: () => React.ReactNode };
  const html = renderToStaticMarkup(<SiteFooter />);

  assert.match(html, /href="\/security"/);
  assert.match(html, /Security &amp; Trust/);
  assert.match(html, /Creator Settlement/);
});

test("My Page remains active on profile sub-routes", async () => {
  const { SiteNavigation } = await import("../components/SiteNavigation");
  const html = renderToStaticMarkup(<SiteNavigation pathname="/profile/edit" />);
  const myPageLink = html.match(/<a[^>]*>My Page<\/a>/)?.[0];

  assert.ok(myPageLink);
  assert.match(myPageLink, /href="\/profile"/);
  assert.match(myPageLink, /aria-current="page"/);
});

test("mobile wallet controls stay outside the primary navigation landmark", async () => {
  const navigationModule = await import("../components/SiteNavigation");

  assert.equal(
    typeof (navigationModule as { MobileNavigationPanel?: unknown }).MobileNavigationPanel,
    "function",
    "MobileNavigationPanel should separate product navigation from wallet controls"
  );

  const { MobileNavigationPanel } = navigationModule as {
    MobileNavigationPanel: (props: { pathname: string; children: React.ReactNode }) => React.ReactNode;
  };
  const html = renderToStaticMarkup(
    <MobileNavigationPanel pathname="/dashboard">
      <a href="/wallet">Circle Wallet</a>
    </MobileNavigationPanel>
  );
  const primaryNavigation = html.match(/<nav[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/)?.[0];

  assert.ok(primaryNavigation);
  assert.doesNotMatch(primaryNavigation, /Circle Wallet|href="\/wallet"/);
  assert.match(html, /aria-label="Wallet"/);
  assert.match(html, /href="\/wallet">Circle Wallet<\/a>/);
});
