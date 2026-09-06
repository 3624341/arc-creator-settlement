import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("contract actions expose classified errors and retry", () => {
  const source = readFileSync(new URL("../app/contracts/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /explainError/);
  assert.match(source, /role="alert"/);
  assert.match(source, />Retry</);
  assert.match(source, /insufficient/);
  const shell = readFileSync(new URL("../components/Shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /connectError/);
  assert.match(shell, /role="alert"/);
  assert.match(shell, /catch/);
  const wallet = readFileSync(new URL("../lib/browser-wallet.ts", import.meta.url), "utf8");
  assert.match(wallet, /provider/);
  assert.match(shell, /OKX Wallet/);
});
