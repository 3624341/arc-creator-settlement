export type CreatorProfileRow = {
  wallet_address: string;
  display_name: string;
  headline: string | null;
  bio: string;
  avatar_url: string | null;
  country_code: string | null;
  languages: string[];
  roles: string[];
  skills: string[];
  preferred_campaigns: string[];
  availability: "available" | "limited" | "unavailable";
  typical_turnaround_days: number | null;
  social_links: unknown[];
  portfolio_items: unknown[];
  is_public: boolean;
  profile_version: number;
  created_at: string;
  updated_at: string;
};

export function toCreatorProfile(row: CreatorProfileRow) {
  return {
    walletAddress: row.wallet_address,
    displayName: row.display_name,
    headline: row.headline ?? "",
    bio: row.bio,
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
    ...(row.country_code ? { countryCode: row.country_code } : {}),
    languages: row.languages ?? [],
    roles: row.roles ?? [],
    skills: row.skills ?? [],
    preferredCampaigns: row.preferred_campaigns ?? [],
    availability: row.availability,
    ...(row.typical_turnaround_days === null ? {} : { typicalTurnaroundDays: row.typical_turnaround_days }),
    socialLinks: row.social_links ?? [],
    portfolioItems: row.portfolio_items ?? [],
    isPublic: row.is_public,
    profileVersion: row.profile_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
