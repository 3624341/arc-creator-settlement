import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("dashboard exposes the verified public demo", () => {
  const dashboard = readFileSync(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8");
  const contract = readFileSync(new URL("../app/contracts/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /Public demo/);
  assert.match(dashboard, /0x22De463e9969b8Cef07b151b9cB5D8c5A16D81Df/);
  assert.match(dashboard, /Build Notes/);
  assert.match(dashboard, /Share feedback/);
  assert.match(dashboard, /Integration guide/);
  assert.match(dashboard, /arc-creator-settlement\/issues/);
  assert.match(dashboard, /View updates/);
  const updates = readFileSync(new URL("../app/updates/page.tsx", import.meta.url), "utf8");
  assert.match(updates, /Changelog/);
  assert.match(updates, /Feedback status/);
  assert.match(updates, /Shipped/);
  assert.match(updates, /In progress/);
  assert.match(contract, /demoMode/);
  assert.match(contract, /read-only/);
});
