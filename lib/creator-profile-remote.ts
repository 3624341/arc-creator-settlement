import type { CreatorProfile, CreatorProfilePayload, CreatorVerification } from "./creator-profile";

export type RemoteCreatorProfile = CreatorProfile & { verification: CreatorVerification };

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "PROFILES_UNAVAILABLE");
  return body;
}

export async function getRemoteProfile(wallet: string) {
  const body = await request(`/api/profiles/${encodeURIComponent(wallet)}`);
  return { profile: body.profile as CreatorProfile, verification: body.verification as CreatorVerification };
}

export async function listRemoteProfiles(wallets: string[]) {
  if (!wallets.length) return [] as RemoteCreatorProfile[];
  const body = await request(`/api/profiles?wallets=${wallets.map(encodeURIComponent).join(",")}`);
  return Array.isArray(body.profiles) ? body.profiles.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as { profile?: CreatorProfile; verification?: CreatorVerification };
    return record.profile && record.verification ? [{ ...record.profile, verification: record.verification }] : [];
  }) : [];
}

export async function saveRemoteProfile(input: { walletAddress: string; profile: CreatorProfilePayload; profileVersion: number; issuedAt: string; signature: string }) {
  const body = await request(`/api/profiles/${encodeURIComponent(input.walletAddress)}`, { method: "PUT", body: JSON.stringify(input) });
  return { profile: body.profile as CreatorProfile, verification: body.verification as CreatorVerification };
}
