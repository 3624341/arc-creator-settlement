import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("profile page exposes wallet workspace sections", () => {
  const page = readFileSync(new URL("../app/profile/page.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/Shell.tsx", import.meta.url), "utf8");
  assert.match(page, /Created Jobs/);
  assert.match(page, /My Applications/);
  assert.match(page, /Active Work/);
  assert.match(page, /Connect a wallet/);
  assert.match(shell, /My Page/);
});
