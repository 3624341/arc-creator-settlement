import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("dashboard exposes the verified public demo", () => {
  const dashboard = readFileSync(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8");
  const contract = readFileSync(new URL("../app/contracts/[id]/page.tsx", import.meta.url), "utf8");
  const builderHub = readFileSync(new URL("../app/builder-hub/page.tsx", import.meta.url), "utf8");
  assert.match(builderHub, /Public demo/);
  assert.match(builderHub, /Build Notes/);
  assert.match(builderHub, /Share feedback/);
  assert.match(builderHub, /Integration guide/);
  assert.match(builderHub, /arc-creator-settlement\/issues/);
  assert.match(builderHub, /View updates/);
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
  assert.match(create, /advertiser: account \?\? creator/);
  assert.match(create, />Remove<\/button>/);
  assert.match(contract, /demoMode/);
  assert.match(contract, /read-only/);
});
