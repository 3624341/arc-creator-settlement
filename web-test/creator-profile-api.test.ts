import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const collection = readFileSync(new URL("../app/api/profiles/route.ts", import.meta.url), "utf8");
const single = readFileSync(new URL("../app/api/profiles/[wallet]/route.ts", import.meta.url), "utf8");

test("profile collection API normalizes wallets, limits batches, and reads public profiles only", () => {
  assert.match(collection, /export async function GET/);
  assert.match(collection, /50/);
  assert.match(collection, /is_public/);
  assert.match(collection, /Cache-Control/);
  assert.match(collection, /creator_address/);
});

test("single profile API separates not-found from service errors", () => {
  assert.match(single, /export async function GET/);
  assert.match(single, /404/);
  assert.match(single, /503/);
  assert.match(single, /is_public/);
  assert.match(single, /Cache-Control/);
});

test("profile update API verifies signer, freshness, payload hash, and optimistic version", () => {
  assert.match(single, /export async function PUT/);
  assert.match(single, /verifyMessage/);
  assert.match(single, /isIssuedAtFresh/);
  assert.match(single, /createPayloadHash/);
  assert.match(single, /isNextProfileVersion/);
  assert.match(single, /401/);
  assert.match(single, /409/);
  assert.match(single, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(single, /NEXT_PUBLIC_SUPABASE_SERVICE/);
});
