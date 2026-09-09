import { createClient } from "@supabase/supabase-js";
import { verifyMessage } from "viem";
import { createPayloadHash, buildProfileSigningMessage, isIssuedAtFresh, isNextProfileVersion } from "@/lib/creator-profile-signing";
import { normalizeWallet, validateCreatorProfilePayload } from "@/lib/creator-profile";
import { summarizeCreatorSettlement } from "@/lib/creator-verification";
import { toCreatorProfile, type CreatorProfileRow } from "@/lib/creator-profile-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileColumns = "wallet_address,display_name,headline,bio,avatar_url,country_code,languages,roles,skills,preferred_campaigns,availability,typical_turnaround_days,social_links,portfolio_items,is_public,profile_version,created_at,updated_at";
const receiptColumns = "status,creator_address,escrow_address,amount_usdc";
const noStore = { "Cache-Control": "no-store" };

function backend() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && secret ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } }) : undefined;
}

function invalidWalletResponse() {
  return Response.json({ error: "INVALID_WALLET" }, { status: 400, headers: noStore });
}

async function readProfile(client: any, wallet: string) {
  return client.from("creator_profiles").select(profileColumns).eq("wallet_address", wallet).eq("is_public", true).maybeSingle();
}

export async function GET(_request: Request, context: { params: Promise<{ wallet: string }> }) {
  const wallet = normalizeWallet((await context.params).wallet);
  if (!wallet) return invalidWalletResponse();
  const client = backend();
  if (!client) return Response.json({ error: "PROFILES_UNAVAILABLE" }, { status: 503, headers: noStore });
  const result = await readProfile(client, wallet);
  if (result.error) return Response.json({ error: "PROFILES_UNAVAILABLE" }, { status: 503, headers: noStore });
  if (!result.data) return Response.json({ error: "PROFILE_NOT_FOUND" }, { status: 404, headers: noStore });
  const receipts = await client.from("settlement_receipts").select(receiptColumns).eq("creator_address", wallet).eq("status", "confirmed");
  if (receipts.error) return Response.json({ error: "PROFILES_UNAVAILABLE" }, { status: 503, headers: noStore });
  return Response.json({ profile: toCreatorProfile(result.data as CreatorProfileRow), verification: summarizeCreatorSettlement(receipts.data ?? [], wallet) }, { headers: noStore });
}

export async function PUT(request: Request, context: { params: Promise<{ wallet: string }> }) {
  const wallet = normalizeWallet((await context.params).wallet);
  if (!wallet) return invalidWalletResponse();
  const client = backend();
  if (!client) return Response.json({ error: "PROFILES_UNAVAILABLE" }, { status: 503, headers: noStore });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const profileInput = body?.profile;
  const outerWallet = normalizeWallet(body?.walletAddress);
  const requestedVersion = body?.profileVersion;
  const issuedAt = typeof body?.issuedAt === "string" ? body.issuedAt : "";
  const signature = typeof body?.signature === "string" ? body.signature : "";
  const validated = validateCreatorProfilePayload(profileInput);
  if (!validated.ok || outerWallet !== wallet || validated.value.walletAddress !== wallet || !Number.isInteger(requestedVersion) || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    return Response.json({ error: "INVALID_PROFILE_UPDATE" }, { status: 400, headers: noStore });
  }
  if (!isIssuedAtFresh(issuedAt)) return Response.json({ error: "PROFILE_SIGNATURE_EXPIRED" }, { status: 401, headers: noStore });

  const current = await client.from("creator_profiles").select("profile_version").eq("wallet_address", wallet).maybeSingle();
  if (current.error) return Response.json({ error: "PROFILES_UNAVAILABLE" }, { status: 503, headers: noStore });
  const currentVersion = current.data?.profile_version ?? 0;
  if (!isNextProfileVersion(currentVersion, requestedVersion as number)) return Response.json({ error: "PROFILE_VERSION_CONFLICT" }, { status: 409, headers: noStore });

  const payloadHash = await createPayloadHash(validated.value);
  const message = buildProfileSigningMessage({ walletAddress: wallet, profileVersion: requestedVersion as number, issuedAt, payloadHash });
  let verified = false;
  try {
    verified = await verifyMessage({ address: wallet as `0x${string}`, message, signature: signature as `0x${string}` });
  } catch {
    verified = false;
  }
  if (!verified) return Response.json({ error: "PROFILE_SIGNATURE_INVALID" }, { status: 401, headers: noStore });

  const value = validated.value;
  const saved = await client.from("creator_profiles").upsert({
    wallet_address: wallet,
    display_name: value.displayName,
    headline: value.headline || null,
    bio: value.bio,
    avatar_url: value.avatarUrl ?? null,
    country_code: value.countryCode ?? null,
    languages: value.languages,
    roles: value.roles,
    skills: value.skills,
    preferred_campaigns: value.preferredCampaigns,
    availability: value.availability,
    typical_turnaround_days: value.typicalTurnaroundDays ?? null,
    social_links: value.socialLinks,
    portfolio_items: value.portfolioItems,
    is_public: value.isPublic,
    profile_version: requestedVersion,
    updated_at: new Date().toISOString(),
  }, { onConflict: "wallet_address" }).select(profileColumns).single();
  if (saved.error) return Response.json({ error: "PROFILE_SAVE_FAILED" }, { status: 503, headers: noStore });
  return Response.json({ profile: toCreatorProfile(saved.data as CreatorProfileRow), verification: { walletSigned: true, arcSettlementVerified: false, completedPayouts: 0, distinctEscrows: 0, totalPaidUsdc: "0.00" } }, { headers: noStore });
}
