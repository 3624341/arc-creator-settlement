import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/contracts/[id]/page.tsx", import.meta.url), "utf8");

test("contract detail exposes a duplicate-safe creator application action", () => {
  assert.match(source, /Apply as creator/);
  assert.match(source, /status:\s*"Applied"/);
  assert.match(source, /saveApplication\(/);
  assert.match(source, /Application already submitted/);
  assert.match(source, /Contract owners cannot apply/);
  assert.match(source, /Connect a wallet before applying/);
});

test("creator application respects demo mode and hides the action for owners", () => {
  assert.match(source, /disabled=\{demoMode\}/);
  assert.match(source, /!isOwner && !application/);
  assert.match(source, /getCircleSession\(\)/);
  assert.match(source, /arc-browser-wallet/);
});

test("browser wallet writes include explicit gas for OKX", () => {
  assert.match(source, /estimateContractGas/);
});

test("contract detail explains when a local record has no deployed escrow", () => {
  assert.match(source, /Escrow address is missing/);
  assert.match(source, /disabled=\{demoMode \|\| !address\}/);
});
