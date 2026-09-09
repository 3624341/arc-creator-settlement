export const CREATOR_ROLES = [
  "Content Creator",
  "Influencer",
  "KOL",
  "Developer",
  "Community Manager",
  "Designer",
  "Video Creator",
  "Translator",
  "Event Host",
] as const;

export type CreatorRole = typeof CREATOR_ROLES[number];
export type Availability = "available" | "limited" | "unavailable";
export type SocialPlatform = "telegram" | "x" | "youtube" | "instagram" | "tiktok" | "linkedin" | "github" | "website";
export type PortfolioType = "article" | "x-thread" | "video" | "project" | "community" | "event" | "other";

export type CreatorSocialLink = {
  platform: SocialPlatform;
  url: string;
  handle?: string;
  followerCount?: number;
};

export type CreatorPortfolioItem = {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: PortfolioType;
};

export type CreatorProfilePayload = {
  walletAddress: string;
  displayName: string;
  headline?: string;
  bio: string;
  avatarUrl?: string;
  countryCode?: string;
  languages: string[];
  roles: CreatorRole[];
  skills: string[];
  preferredCampaigns: string[];
  availability: Availability;
  typicalTurnaroundDays?: number;
  socialLinks: CreatorSocialLink[];
  portfolioItems: CreatorPortfolioItem[];
  isPublic: boolean;
};

export type CreatorProfile = CreatorProfilePayload & {
  profileVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type CreatorVerification = {
  walletSigned: boolean;
  arcSettlementVerified: boolean;
  completedPayouts: number;
  distinctEscrows: number;
  totalPaidUsdc: string;
};

export const SELF_REPORTED_LABEL = "Self-reported";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const SOCIAL_PLATFORMS: readonly SocialPlatform[] = ["telegram", "x", "youtube", "instagram", "tiktok", "linkedin", "github", "website"];
const PORTFOLIO_TYPES: readonly PortfolioType[] = ["article", "x-thread", "video", "project", "community", "event", "other"];
const SOCIAL_HOSTS: Partial<Record<Exclude<SocialPlatform, "website">, readonly string[]>> = {
  telegram: ["t.me", "telegram.me"],
  x: ["x.com", "twitter.com"],
  youtube: ["youtube.com", "youtu.be"],
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  linkedin: ["linkedin.com"],
  github: ["github.com"],
};

export function normalizeWallet(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return ADDRESS_PATTERN.test(trimmed) ? trimmed.toLowerCase() : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function validHost(hostname: string, allowed: readonly string[]) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return allowed.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
}

function validateHttpsUrl(value: unknown, allowedHosts?: readonly string[]) {
  if (typeof value !== "string" || value.length > 2_000) return "URL is invalid.";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "URL must use HTTPS.";
    if (allowedHosts && !validHost(url.hostname, allowedHosts)) return "URL hostname is not allowed for this platform.";
    return undefined;
  } catch {
    return "URL is invalid.";
  }
}

export function validateSocialLink(link: unknown): string | undefined {
  if (!link || typeof link !== "object") return "Social link is invalid.";
  const record = link as Record<string, unknown>;
  const platform = record.platform;
  if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) return "Social platform is not supported.";
  const error = validateHttpsUrl(record.url, platform === "website" ? undefined : SOCIAL_HOSTS[platform as Exclude<SocialPlatform, "website">]);
  if (error) return error;
  if (record.handle !== undefined && (typeof record.handle !== "string" || record.handle.trim().length > 80)) return "Social handle is invalid.";
  if (record.followerCount !== undefined && (!Number.isInteger(record.followerCount) || Number(record.followerCount) < 0)) return "Follower count must be a non-negative integer.";
  return undefined;
}

function validateArrayOfText(value: unknown, field: string, min: number, max: number, maxItemLength: number, errors: Record<string, string>) {
  if (!Array.isArray(value) || value.length < min || value.length > max || value.some((item) => typeof item !== "string" || item.trim().length === 0 || item.trim().length > maxItemLength)) {
    errors[field] = `${field} must contain ${min === max ? min : `${min}-${max}`} valid items.`;
    return [];
  }
  return value.map((item) => (item as string).trim());
}

export function validateCreatorProfilePayload(input: unknown): { ok: true; value: CreatorProfilePayload } | { ok: false; errors: Record<string, string> } {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const errors: Record<string, string> = {};
  const walletAddress = normalizeWallet(source.walletAddress);
  if (!walletAddress) errors.walletAddress = "Enter a valid Ethereum wallet address.";

  const displayName = text(source.displayName);
  if (!displayName || displayName.length > 80) errors.displayName = "Display name is required and must be at most 80 characters.";
  const headline = text(source.headline) ?? "";
  if (headline.length > 140) errors.headline = "Headline must be at most 140 characters.";
  const bio = text(source.bio);
  if (!bio || bio.length < 40 || bio.length > 1_000) errors.bio = "Bio must be between 40 and 1,000 characters.";
  if (source.avatarUrl !== undefined && validateHttpsUrl(source.avatarUrl)) errors.avatarUrl = "Avatar URL must be a valid HTTPS URL.";
  const countryCode = text(source.countryCode)?.toUpperCase() ?? "";
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) errors.countryCode = "Country code must be ISO alpha-2.";

  const languages = validateArrayOfText(source.languages, "languages", 1, 10, 60, errors);
  const roles = validateArrayOfText(source.roles, "roles", 1, CREATOR_ROLES.length, 40, errors);
  if (roles.some((role) => !CREATOR_ROLES.includes(role as CreatorRole))) errors.roles = "Select only supported creator roles.";
  const skills = source.skills === undefined ? [] : validateArrayOfText(source.skills, "skills", 0, 20, 40, errors);
  const preferredCampaigns = source.preferredCampaigns === undefined ? [] : validateArrayOfText(source.preferredCampaigns, "preferredCampaigns", 0, 20, 80, errors);

  const availability = source.availability;
  if (availability !== "available" && availability !== "limited" && availability !== "unavailable") errors.availability = "Select a valid availability state.";
  if (source.typicalTurnaroundDays !== undefined && (!Number.isInteger(source.typicalTurnaroundDays) || Number(source.typicalTurnaroundDays) < 1 || Number(source.typicalTurnaroundDays) > 365)) errors.typicalTurnaroundDays = "Turnaround must be between 1 and 365 days.";
  if (!Array.isArray(source.socialLinks) || source.socialLinks.length > 10) errors.socialLinks = "Add up to 10 social links.";
  const socialLinks = Array.isArray(source.socialLinks) ? source.socialLinks.map((link) => {
    const error = validateSocialLink(link);
    if (error && !errors.socialLinks) errors.socialLinks = error;
    return link as CreatorSocialLink;
  }) : [];
  if (!Array.isArray(source.portfolioItems) || source.portfolioItems.length > 6) errors.portfolioItems = "Add up to 6 portfolio items.";
  const portfolioItems = Array.isArray(source.portfolioItems) ? source.portfolioItems.map((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const itemError = validateHttpsUrl(record.url);
    if (!text(record.id) || !text(record.title) || text(record.title)!.length > 120 || itemError || !PORTFOLIO_TYPES.includes(record.type as PortfolioType)) {
      if (!errors.portfolioItems) errors.portfolioItems = "Each portfolio item needs a title, HTTPS URL, and supported type.";
    }
    return {
      id: text(record.id) ?? "",
      title: text(record.title) ?? "",
      description: text(record.description),
      url: text(record.url) ?? "",
      type: record.type as PortfolioType,
    };
  }) : [];
  if (typeof source.isPublic !== "boolean") errors.isPublic = "Visibility must be selected.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      walletAddress: walletAddress!,
      displayName: displayName!,
      headline,
      bio: bio!,
      ...(text(source.avatarUrl) ? { avatarUrl: text(source.avatarUrl) } : {}),
      ...(countryCode ? { countryCode } : {}),
      languages,
      roles: roles as CreatorRole[],
      skills,
      preferredCampaigns,
      availability: availability as Availability,
      ...(source.typicalTurnaroundDays !== undefined ? { typicalTurnaroundDays: Number(source.typicalTurnaroundDays) } : {}),
      socialLinks,
      portfolioItems,
      isPublic: source.isPublic as boolean,
    },
  };
}

export function isProfileComplete(profile: Partial<CreatorProfilePayload> | undefined): boolean {
  if (!profile || profile.isPublic !== true) return false;
  if (!text(profile.displayName) || !text(profile.bio) || text(profile.bio)!.length < 40) return false;
  if (!Array.isArray(profile.roles) || profile.roles.length < 1) return false;
  if (!Array.isArray(profile.languages) || profile.languages.length < 1) return false;
  return (Array.isArray(profile.socialLinks) && profile.socialLinks.length > 0) || (Array.isArray(profile.portfolioItems) && profile.portfolioItems.length > 0);
}
