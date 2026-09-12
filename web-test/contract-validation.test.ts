import assert from "node:assert/strict";
import test from "node:test";
import { validateContractDraft } from "../lib/contract-validation";

const creator = "0x2e68faf7b9ffdd582d4338b4534bc1704d9d9b2b";
const description = "A".repeat(20);

test("contract draft validation rejects empty and malformed values", () => {
  assert.equal(validateContractDraft("", description, creator, [{ description: "Proof", amount: "1" }]), "Enter a project title.");
  assert.equal(validateContractDraft("QA", description, "not-an-address", [{ description: "Proof", amount: "1" }]), "Enter a valid creator wallet address.");
  assert.equal(validateContractDraft("QA", description, creator, []), "Add at least one milestone.");
  assert.match(validateContractDraft("QA", description, creator, [{ description: "Proof", amount: "1.1234567" }]) ?? "", /up to 6 decimals/);
});

test("contract draft validation accepts a positive USDC milestone", () => {
  assert.equal(validateContractDraft("QA A-B Settlement", description, creator, [{ description: "Onchain proof", amount: "0.1" }]), undefined);
});

test("contract draft validation allows an unassigned creator", () => {
  assert.equal(validateContractDraft("Open creator job", description, "", [{ description: "Onchain proof", amount: "1" }]), undefined);
});

test("contract draft validation enforces trimmed job description boundaries", () => {
  const milestone = [{ description: "Onchain proof", amount: "1" }];

  assert.equal(validateContractDraft("QA", `  ${"A".repeat(19)}  `, creator, milestone), "Enter a job description of at least 20 characters.");
  assert.equal(validateContractDraft("QA", `  ${"A".repeat(20)}  `, creator, milestone), undefined);
  assert.equal(validateContractDraft("QA", "A".repeat(2_000), creator, milestone), undefined);
  assert.equal(validateContractDraft("QA", "A".repeat(2_001), creator, milestone), "Keep the job description within 2,000 characters.");
});
