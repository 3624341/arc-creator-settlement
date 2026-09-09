import assert from "node:assert/strict";
import test from "node:test";
import { validateContractDraft } from "../lib/contract-validation";

const creator = "0x2e68faf7b9ffdd582d4338b4534bc1704d9d9b2b";

test("contract draft validation rejects empty and malformed values", () => {
  assert.equal(validateContractDraft("", creator, [{ description: "Proof", amount: "1" }]), "Enter a project title.");
  assert.equal(validateContractDraft("QA", "not-an-address", [{ description: "Proof", amount: "1" }]), "Enter a valid creator wallet address.");
  assert.equal(validateContractDraft("QA", creator, []), "Add at least one milestone.");
  assert.match(validateContractDraft("QA", creator, [{ description: "Proof", amount: "1.1234567" }]) ?? "", /up to 6 decimals/);
});

test("contract draft validation accepts a positive USDC milestone", () => {
  assert.equal(validateContractDraft("QA A-B Settlement", creator, [{ description: "Onchain proof", amount: "0.1" }]), undefined);
});

test("contract draft validation allows an unassigned creator", () => {
  assert.equal(validateContractDraft("Open creator job", "", [{ description: "Onchain proof", amount: "1" }]), undefined);
});
