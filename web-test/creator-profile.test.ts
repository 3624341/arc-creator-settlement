import assert from "node:assert/strict";
import test from "node:test";
import {
  CREATOR_ROLES,
  isProfileComplete,
  normalizeWallet,
  validateCreatorProfilePayload,
  validateSocialLink,
  type CreatorProfilePayload,
} from "../lib/creator-profile";

const wallet = "0xAbCDeF0123456789012345678901234567890123";

function validPayload(overrides: Partial<CreatorProfilePayload> = {}): CreatorProfilePayload {
  return {
    walletAddress: wallet,
    displayName: "Ada Creator",
    headline: "Web3 educator and video creator",
    bio: "I create clear educational content for Web3 teams and communities around the world.",
    countryCode: "KR",
    languages: ["English", "Korean"],
    roles: ["Content Creator"],
    skills: ["Scripting", "Video editing"],
    preferredCampaigns: ["Tutorial", "X Thread"],
    availability: "available",
    typicalTurnaroundDays: 7,
    socialLinks: [{ platform: "x", url: "https://x.com/ada", handle: "ada" }],
    portfolioItems: [],
    isPublic: true,
    ...overrides,
  };
}

test("normalizes a valid Ethereum wallet and rejects malformed addresses", () => {
  assert.equal(normalizeWallet(wallet), wallet.toLowerCase());
  assert.equal(normalizeWallet("not-a-wallet"), undefined);
});

test("accepts the complete Creator Passport payload", () => {
  const result = validateCreatorProfilePayload(validPayload());
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.displayName, "Ada Creator");
});

test("rejects unknown roles and oversized skill arrays", () => {
  assert.equal(CREATOR_ROLES.includes("Content Creator"), true);
  const unknownRole = validateCreatorProfilePayload(validPayload({ roles: ["Astronaut" as never] }));
  const tooManySkills = validateCreatorProfilePayload(validPayload({ skills: Array.from({ length: 21 }, (_, index) => `Skill ${index}`) }));
  assert.equal(unknownRole.ok, false);
  assert.equal(tooManySkills.ok, false);
});

test("rejects short bios, invalid protocol, and invalid follower counts", () => {
  const shortBio = validateCreatorProfilePayload(validPayload({ bio: "Too short" }));
  const invalidAvatar = validateCreatorProfilePayload(validPayload({ avatarUrl: "javascript:alert(1)" }));
  const invalidFollowers = validateCreatorProfilePayload(validPayload({
    socialLinks: [{ platform: "x", url: "https://x.com/ada", followerCount: -1 }],
  }));
  assert.equal(shortBio.ok, false);
  assert.equal(invalidAvatar.ok, false);
  assert.equal(invalidFollowers.ok, false);
});

test("requires at least one public social link or portfolio item", () => {
  const empty = validPayload({ socialLinks: [], portfolioItems: [] });
  assert.equal(isProfileComplete(empty), false);
  assert.equal(isProfileComplete(validPayload()), true);
  assert.equal(isProfileComplete(validPayload({ isPublic: false })), false);
});

test("validates platform hostnames while allowing generic HTTPS websites", () => {
  assert.equal(validateSocialLink({ platform: "x", url: "https://x.com/ada" }), undefined);
  assert.match(validateSocialLink({ platform: "x", url: "https://example.com/ada" }) ?? "", /hostname/i);
  assert.equal(validateSocialLink({ platform: "website", url: "https://example.com/ada" }), undefined);
  assert.match(validateSocialLink({ platform: "youtube", url: "http://youtube.com/ada" }) ?? "", /https/i);
});
