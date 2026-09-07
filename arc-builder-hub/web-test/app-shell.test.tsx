import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "../app/page";

test("reviewers can reach the live product and the exact recorded payment without a wallet", () => {
  const html = renderToStaticMarkup(React.createElement(HomePage));
  assert.ok(html.includes('href="https://arc-creator-settlement-v0-2.vercel.app"'));
  assert.ok(html.includes('href="https://testnet.arcscan.app/tx/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856"'));
  assert.ok(html.includes("RECORDED TESTNET EXAMPLE"));
  const externalLinks = html.match(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g) ?? [];
  assert.ok(externalLinks.length > 0);
  for (const link of externalLinks) assert.equal((link.match(/↗/g) ?? []).length, 1, link);
  assert.ok(html.includes('aria-label="Copy release transaction"'));
  assert.ok(html.includes('id="evidence"'));
  assert.ok(html.includes('id="guide"'));
  assert.ok(html.includes('id="updates"'));
});
