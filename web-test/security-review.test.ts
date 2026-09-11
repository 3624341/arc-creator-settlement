import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const flagsSource = readFileSync(new URL("../lib/feature-flags.ts", import.meta.url), "utf8");
const detailSource = readFileSync(new URL("../app/contracts/[id]/page.tsx", import.meta.url), "utf8");
const shellSource = readFileSync(new URL("../components/Shell.tsx", import.meta.url), "utf8");
const securitySource = readFileSync(new URL("../app/security/page.tsx", import.meta.url), "utf8");
const reportSource = readFileSync(new URL("../docs/security/provider-false-positive-reports.md", import.meta.url), "utf8");

test("public wallet features have an explicit production kill switch", () => {
  assert.match(flagsSource, /NEXT_PUBLIC_CROSS_CHAIN_FUNDING_ENABLED/);
  assert.match(flagsSource, /NEXT_PUBLIC_TESTNET_NETWORK_SETUP_ENABLED/);
  assert.match(detailSource, /CROSS_CHAIN_FUNDING_ENABLED/);
  assert.match(detailSource, /temporarily unavailable while the security review is in progress/i);
  assert.match(shellSource, /TESTNET_NETWORK_SETUP_ENABLED/);
});

test("security page explains trust boundaries without requesting wallet secrets", () => {
  assert.match(securitySource, /Security & trust/i);
  assert.match(securitySource, /never ask for.*seed phrase/i);
  assert.match(securitySource, /personal_sign/i);
  assert.match(securitySource, /approve/i);
  assert.match(securitySource, /Base Sepolia/i);
  assert.match(securitySource, /Arc Testnet/i);
  assert.match(securitySource, /GitHub/i);
  assert.match(securitySource, /MetaMask/i);
  assert.match(securitySource, /OKX/i);
  assert.match(securitySource, /UniSat/i);
});

test("provider report packet identifies both domains and the safe wallet boundary", () => {
  assert.match(reportSource, /creatorsettle\.com/);
  assert.match(reportSource, /www\.creatorsettle\.com/);
  assert.match(reportSource, /MetaMask/);
  assert.match(reportSource, /OKX/);
  assert.match(reportSource, /UniSat/);
  assert.match(reportSource, /seed phrase/i);
  assert.match(reportSource, /personal_sign/);
});
