import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const addressPattern = /^0x[a-fA-F0-9]{40}$/;
type ApplicationRow = {
  id: string;
  contract_id: string;
  escrow_address: string | null;
  applicant_wallet: string;
  status: "Applied" | "Selected" | "Rejected" | "Completed";
  applied_at: string;
  updated_at: string;
};

function backend() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && secret ? createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } }) : undefined;
}

function toApplication(row: ApplicationRow) {
  return {
    id: row.id,
    contractId: row.contract_id,
    escrowAddress: row.escrow_address,
    applicant: row.applicant_wallet,
    status: row.status,
    appliedAt: row.applied_at,
    updatedAt: row.updated_at
  };
}

export async function GET(request: Request) {
  const client = backend();
  if (!client) return Response.json({ enabled: false, applications: [] }, { status: 503 });

  const params = new URL(request.url).searchParams;
  const contractIds = [...new Set([
    ...params.getAll("contractId"),
    ...(params.get("contractIds") ?? "").split(",")
  ].map((value) => value.trim()).filter(Boolean))];
  const applicant = params.get("applicant")?.trim();
  if (!contractIds.length && !applicant) return Response.json({ enabled: true, applications: [] });
  if (applicant && !addressPattern.test(applicant)) return Response.json({ error: "INVALID_APPLICANT_WALLET" }, { status: 400 });

  let query = client.from("job_applications").select("id,contract_id,escrow_address,applicant_wallet,status,applied_at,updated_at").order("applied_at", { ascending: false });
  if (contractIds.length) query = query.in("contract_id", contractIds);
  if (applicant) query = query.eq("applicant_wallet", applicant.toLowerCase());
  const { data, error } = await query.limit(100);
  if (error) return Response.json({ error: "APPLICATIONS_UNAVAILABLE" }, { status: 503 });
  return Response.json({ enabled: true, applications: (data as ApplicationRow[] ?? []).map(toApplication) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const client = backend();
  if (!client) return Response.json({ enabled: false, error: "APPLICATIONS_UNAVAILABLE" }, { status: 503 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const contractId = typeof body?.contractId === "string" ? body.contractId.trim() : "";
  const applicant = typeof body?.applicant === "string" ? body.applicant.trim().toLowerCase() : "";
  const escrowAddress = typeof body?.escrowAddress === "string" ? body.escrowAddress.trim() : null;
  if (!contractId || !applicant || !addressPattern.test(applicant) || (escrowAddress && !addressPattern.test(escrowAddress))) {
    return Response.json({ error: "INVALID_APPLICATION" }, { status: 400 });
  }
  const { data, error } = await client.from("job_applications").upsert({
    contract_id: contractId,
    escrow_address: escrowAddress,
    applicant_wallet: applicant,
    status: "Applied",
    updated_at: new Date().toISOString()
  }, { onConflict: "contract_id,applicant_wallet", ignoreDuplicates: false }).select("id,contract_id,escrow_address,applicant_wallet,status,applied_at,updated_at").single();
  if (error) {
    if (error.code === "23505") return Response.json({ error: "DUPLICATE_APPLICATION" }, { status: 409 });
    return Response.json({ error: "APPLICATION_SAVE_FAILED" }, { status: 503 });
  }
  return Response.json({ enabled: true, application: toApplication(data as ApplicationRow) }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
