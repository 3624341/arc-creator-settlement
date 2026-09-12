import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("dashboard exposes the verified public demo", () => {
  const dashboard = readFileSync(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8");
  const contract = readFileSync(new URL("../app/contracts/[id]/page.tsx", import.meta.url), "utf8");
  const builderHub = readFileSync(new URL("../app/builder-hub/page.tsx", import.meta.url), "utf8");
  assert.match(builderHub, /next\/navigation/);
  assert.match(builderHub, /https:\/\/arc-builder-hub-theta\.vercel\.app\//);
  assert.match(builderHub, /redirect\(BUILDER_HUB_URL\)/);
  const updates = readFileSync(new URL("../app/updates/page.tsx", import.meta.url), "utf8");
  assert.match(updates, /Changelog/);
  assert.match(updates, /Feedback status/);
  assert.match(updates, /Shipped/);
  assert.match(updates, /In progress/);
  const create = readFileSync(new URL("../app/contracts/create/page.tsx", import.meta.url), "utf8");
  assert.match(create, /useRouter/);
  assert.match(create, /router\.push/);
  assert.match(create, /arc-create-contract-draft/);
  assert.match(create, /useState\(""\)/);
  assert.match(create, /advertiser: account/);
  assert.match(create, />Remove<\/button>/);
  assert.match(contract, /demoMode/);
  assert.match(contract, /read-only/);
});

test("reviewer demo has public entry points and an isolated route", () => {
  const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/Shell.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/demo/page.tsx", import.meta.url), "utf8");
  const publicShell = readFileSync(new URL("../components/PublicDemoShell.tsx", import.meta.url), "utf8");

  assert.match(home, /href="\/demo"/);
  assert.match(home, /View 90-second demo/);
  assert.match(shell, /Reviewer Demo/);
  assert.match(route, /loadReviewerDemo/);
  assert.match(route, /PublicDemoShell/);
  assert.doesNotMatch(route, /@\/components\/Shell/);
  assert.doesNotMatch(
    route + publicShell,
    /browser-wallet|circle-wallet-client|eth_accounts|personal_sign|wallet_addEthereumChain/
  );
});

test("README documents the reviewer demo trust boundary", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

  assert.match(readme, /Reviewer Demo Mode/);
  assert.match(readme, /no wallet/i);
  assert.match(readme, /recorded.*verified|verified.*recorded/is);
  assert.match(readme, /\/demo/);
});
