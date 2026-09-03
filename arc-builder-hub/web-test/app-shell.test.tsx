import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { readFileSync } from "node:fs";

test("renders the Arc Builder Hub application shell", () => {
  const html = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(html, /Builder Hub|KOREA-BASED ARC BUILDER/);
  assert.match(html, /Build, ship, and verify on Arc/);
});
