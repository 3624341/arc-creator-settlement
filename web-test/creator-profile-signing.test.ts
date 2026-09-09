import assert from "node:assert/strict";
import test from "node:test";
import {
  buildApplicationSigningMessage,
  buildProfileSigningMessage,
  createPayloadHash,
  isIssuedAtFresh,
  isNextProfileVersion,
} from "../lib/creator-profile-signing";

test("builds an unambiguous profile signing message", async () => {
  const payloadHash = await createPayloadHash({ displayName: "Ada", roles: ["Developer"] });
  const message = buildProfileSigningMessage({
    walletAddress: "0xABCDEF0123456789012345678901234567890123",
    profileVersion: 2,
    issuedAt: "2026-09-09T00:00:00.000Z",
    payloadHash,
  });
  assert.match(message, /^Arc Creator Settlement profile update\nWallet: 0xabcdef0123456789012345678901234567890123\nVersion: 2\nIssued-At: 2026-09-09T00:00:00\.000Z\nPayload-SHA256: [0-9a-f]{64}$/);
});

test("hashes object keys canonically regardless of insertion order", async () => {
  const first = await createPayloadHash({ z: 1, nested: { b: true, a: "x" }, a: ["one", "two"] });
  const second = await createPayloadHash({ a: ["one", "two"], nested: { a: "x", b: true }, z: 1 });
  assert.equal(first, second);
  assert.equal(first.length, 64);
});

test("builds a versioned application message", () => {
  assert.equal(
    buildApplicationSigningMessage({ contractId: "0xcontract", applicant: "0xABC", profileVersion: 3 }),
    "Arc Creator Settlement application\nContract: 0xcontract\nApplicant: 0xabc\nProfile-Version: 3",
  );
});

test("accepts only fresh issued-at timestamps and the next profile version", () => {
  const now = Date.parse("2026-09-09T00:00:00.000Z");
  assert.equal(isIssuedAtFresh("2026-09-09T00:04:59.000Z", now), true);
  assert.equal(isIssuedAtFresh("2026-09-08T23:54:59.000Z", now), false);
  assert.equal(isNextProfileVersion(4, 5), true);
  assert.equal(isNextProfileVersion(4, 4), false);
});
