import { createClient } from "@supabase/supabase-js";
import { normalizeWallet } from "@/lib/creator-profile";
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

export async function GET(request: Request) {
  const client = backend();
  if (!client) return Response.json({ error: "PROFILES_UNAVAILABLE" }, { status: 503, headers: noStore });
  const raw = new URL(request.url).searchParams.get("wallets");
  if (!raw) return Response.json({ profiles: [] }, { headers: noStore });
  const values = raw.split(",").map((value) => value.trim()).filter(Boolean);
  if (values.length > 50) return Response.json({ error: "TOO_MANY_WALLETS" }, { status: 400, headers: noStore });
  const wallets = [...new Set(values.map(normalizeWallet))];
  if (wallets.some((wallet) => !wallet)) return Response.json({ error: "INVALID_WALLET" }, { status: 400, headers: noStore });
  const normalized = wallets as string[];

  const profileResult = await client.from("creator_profiles").select(profileColumns).in("wallet_address", normalized).eq("is_public", true);
  if (profileResult.error) return Response.json({ error: "PROFILES_UNAVAILABLE" }, { status: 503, headers: noStore });
  const receiptResult = await client.from("settlement_receipts").select(receiptColumns).in("creator_address", normalized).eq("status", "confirmed");
  if (receiptResult.error) return Response.json({ error: "PROFILES_UNAVAILABLE" }, { status: 503, headers: noStore });
  const receipts = receiptResult.data ?? [];
  const profiles = (profileResult.data as CreatorProfileRow[] ?? []).map((row) => ({
    profile: toCreatorProfile(row),
    verification: summarizeCreatorSettlement(receipts, row.wallet_address),
  }));
  return Response.json({ profiles }, { headers: noStore });
}
