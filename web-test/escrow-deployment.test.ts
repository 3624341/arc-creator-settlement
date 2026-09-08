import assert from "node:assert/strict";
import test from "node:test";
import { getEscrowAddressFromCreatedLogs } from "../lib/escrow-deployment";

test("extracts the deployed escrow address from a factory creation log", () => {
  const escrow = "0x22De463e9969b8Cef07b151b9cB5D8c5A16D81Df";
  assert.equal(getEscrowAddressFromCreatedLogs([{ args: { escrow } }]), escrow);
});

test("does not treat an invalid factory log as a deployed escrow", () => {
  assert.equal(getEscrowAddressFromCreatedLogs([{ args: { escrow: "pending-123" } }, {}]), undefined);
});
