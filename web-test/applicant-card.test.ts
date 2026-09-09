import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const card = readFileSync(new URL("../components/ApplicantCard.tsx", import.meta.url), "utf8");
const profilePage = readFileSync(new URL("../app/profile/page.tsx", import.meta.url), "utf8");

test("Applicant Card shows profile-first information, verification, and legacy fallback", () => {
  assert.match(card, /Creator profile not completed|Limited profile information/);
  assert.match(card, /Self-reported|CreatorVerificationBadges/);
  assert.match(card, /Roles|profile\.roles/);
  assert.match(card, /Languages|profile\.languages/);
  assert.match(card, /Skills|profile\.skills/);
  assert.match(card, /View profile/);
  assert.match(card, /CreatorSelectionButton/);
});

test("My Page batch-loads profiles and keeps applicant filters and selection integration", () => {
  assert.match(profilePage, /CreatorPassportSummary/);
  assert.match(profilePage, /listRemoteProfiles/);
  assert.match(profilePage, /ApplicantCard/);
  assert.match(profilePage, /Arc verified first|Newest|Available first/);
  assert.match(profilePage, /Role filter|Language filter/);
  assert.match(card, /CreatorSelectionButton/);
});
