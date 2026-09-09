import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../app/api/applications/route.ts", import.meta.url), "utf8");
const contractPage = readFileSync(new URL("../app/contracts/[id]/page.tsx", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("applications persist nullable profile versions and validate a complete public profile", () => {
  assert.match(route, /profile_version/);
  assert.match(route, /isProfileComplete/);
  assert.match(route, /buildApplicationSigningMessage/);
  assert.match(route, /PROFILE_VERSION_MISMATCH/);
  assert.match(route, /INCOMPLETE_CREATOR_PROFILE/);
  assert.match(schema, /profile_version integer/);
});

test("contract apply flow requires a passport preview before signature", () => {
  assert.match(contractPage, /Complete your Creator Passport before applying/);
  assert.match(contractPage, /ApplicationProfilePreview/);
  assert.match(contractPage, /buildApplicationSigningMessage/);
});
