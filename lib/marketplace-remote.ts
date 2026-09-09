import type { JobApplication } from "./marketplace-store";

export type RemoteApplication = JobApplication & { escrowAddress?: string | null; updatedAt?: string; profileVersion?: number | null };

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "REMOTE_APPLICATIONS_UNAVAILABLE");
  return body;
}

export async function listRemoteApplications(input: { applicant?: string; contractIds?: string[] }) {
  const params = new URLSearchParams();
  if (input.applicant) params.set("applicant", input.applicant);
  if (input.contractIds?.length) params.set("contractIds", input.contractIds.join(","));
  const body = await request(`/api/applications?${params.toString()}`);
  return { enabled: body.enabled === true, applications: Array.isArray(body.applications) ? body.applications as RemoteApplication[] : [] };
}

export async function createRemoteApplication(input: { contractId: string; applicant: string; escrowAddress?: string; message: string; signature: string; profileVersion: number }) {
  const body = await request("/api/applications", { method: "POST", body: JSON.stringify(input) });
  return { enabled: body.enabled === true, application: body.application as RemoteApplication };
}

export async function selectRemoteApplication(input: { contractId: string; applicant: string }) {
  const body = await request("/api/applications", { method: "PATCH", body: JSON.stringify(input) });
  return { enabled: body.enabled === true, application: body.application as RemoteApplication };
}
