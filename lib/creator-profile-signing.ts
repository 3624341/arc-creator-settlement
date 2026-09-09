import { normalizeWallet } from "./creator-profile";

type ProfileSigningInput = {
  walletAddress: string;
  profileVersion: number;
  issuedAt: string;
  payloadHash: string;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
}

export function canonicalizePayload(payload: unknown) {
  return JSON.stringify(canonicalize(payload));
}

export async function createPayloadHash(payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalizePayload(payload));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function buildProfileSigningMessage(input: ProfileSigningInput) {
  const wallet = normalizeWallet(input.walletAddress) ?? input.walletAddress.trim().toLowerCase();
  return [
    "Arc Creator Settlement profile update",
    `Wallet: ${wallet}`,
    `Version: ${input.profileVersion}`,
    `Issued-At: ${input.issuedAt}`,
    `Payload-SHA256: ${input.payloadHash}`,
  ].join("\n");
}

export function buildApplicationSigningMessage(input: { contractId: string; applicant: string; profileVersion: number }) {
  return [
    "Arc Creator Settlement application",
    `Contract: ${input.contractId}`,
    `Applicant: ${input.applicant.trim().toLowerCase()}`,
    `Profile-Version: ${input.profileVersion}`,
  ].join("\n");
}

export function isIssuedAtFresh(issuedAt: string, now = Date.now(), windowMs = 5 * 60 * 1_000) {
  const timestamp = Date.parse(issuedAt);
  return Number.isFinite(timestamp) && Math.abs(now - timestamp) <= windowMs;
}

export function isNextProfileVersion(currentVersion: number, requestedVersion: number) {
  return Number.isInteger(currentVersion) && Number.isInteger(requestedVersion) && requestedVersion === currentVersion + 1;
}
