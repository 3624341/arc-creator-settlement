import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/contracts/[id]/page.tsx", import.meta.url), "utf8");
const createSource = readFileSync(new URL("../app/contracts/create/page.tsx", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("../app/profile/page.tsx", import.meta.url), "utf8");
const selectionSource = readFileSync(new URL("../components/CreatorSelectionButton.tsx", import.meta.url), "utf8");
const applicationsRoute = readFileSync(new URL("../app/api/applications/route.ts", import.meta.url), "utf8");
const remoteSource = readFileSync(new URL("../lib/marketplace-remote.ts", import.meta.url), "utf8");

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
  assert.match(source, /!isOwner && isUnassigned && !application/);
  assert.match(source, /getCircleSession\(\)/);
  assert.match(source, /arc-browser-wallet/);
});

test("browser wallet writes include explicit gas for OKX", () => {
  assert.match(source, /estimateContractGas/);
});

test("contract detail explains when a local record has no deployed escrow", () => {
  assert.match(source, /Escrow address is missing/);
  assert.match(source, /!address/);
});

test("contract detail gates actions by onchain client and creator roles", () => {
  assert.match(source, /clientAddress/);
  assert.match(source, /isClient/);
  assert.match(source, /isCreator/);
  assert.match(source, /Only the advertiser can approve or deposit/);
  assert.match(source, /Only the assigned creator can submit/);
});

test("contract detail disables USDC approval after allowance is sufficient", () => {
  assert.match(source, /allowance/);
  assert.match(source, /usdcApproved/);
  assert.match(source, /Approved/);
  assert.match(source, /Approval complete/);
});

test("contract detail restores the application for the current wallet", () => {
  assert.match(source, /getApplicationForWallet/);
  assert.match(source, /localContract\?\.escrowAddress/);
  assert.match(source, /params\.id/);
});

test("new escrows support an unassigned creator and later assignment", () => {
  assert.match(createSource, /Creator wallet/);
  assert.match(createSource, /optional/);
  assert.match(createSource, /zeroAddress|0x0000000000000000000000000000000000000000/);
  assert.match(selectionSource, /assignCreator/);
  assert.match(source, /Not assigned yet/);
});

test("shared applications can be selected only after onchain creator assignment", () => {
  assert.match(applicationsRoute, /export async function PATCH/);
  assert.match(applicationsRoute, /creator/);
  assert.match(applicationsRoute, /client/);
  assert.match(applicationsRoute, /Selected/);
  assert.match(remoteSource, /selectRemoteApplication/);
  assert.match(selectionSource, /Select creator/);
});
