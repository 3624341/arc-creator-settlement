import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const form = readFileSync(new URL("../components/CreatorProfileForm.tsx", import.meta.url), "utf8");
const publicPage = readFileSync(new URL("../app/creators/[wallet]/page.tsx", import.meta.url), "utf8");
const summary = readFileSync(new URL("../components/CreatorPassportSummary.tsx", import.meta.url), "utf8");
const badges = readFileSync(new URL("../components/CreatorVerificationBadges.tsx", import.meta.url), "utf8");

test("profile editing exposes labelled sections and browser-wallet signing", () => {
  assert.match(form, /Basic identity/);
  assert.match(form, /Roles and skills/);
  assert.match(form, /Languages and region/);
  assert.match(form, /Social channels/);
  assert.match(form, /Portfolio/);
  assert.match(form, /Work preferences/);
  assert.match(form, /personal_sign/);
  assert.match(form, /requires a browser wallet signature/);
  assert.match(form, /Self-reported/);
});

test("public profile handles unavailable state and safe external links", () => {
  assert.match(publicPage, /Creator profile unavailable/);
  assert.match(publicPage, /noopener noreferrer/);
  assert.match(publicPage, /Copy wallet/);
  assert.match(publicPage, /ArcScan/);
});

test("passport summary and verification badges distinguish independent signals", () => {
  assert.match(summary, /Build your Creator Passport/);
  assert.match(summary, /CreatorVerificationBadges/);
  assert.match(badges, /Wallet Signed/);
  assert.match(badges, /Arc Settlement Verified/);
});
