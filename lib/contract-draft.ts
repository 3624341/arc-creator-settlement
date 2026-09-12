import type { ContractDraftMilestone } from "./contract-validation";

export type CreateContractDraft = {
  title: string;
  description: string;
  creator: string;
  milestones: ContractDraftMilestone[];
};

export function parseContractDraft(raw: string | null): CreateContractDraft | undefined {
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return undefined;
    const record = value as Record<string, unknown>;
    if (record.title !== undefined && typeof record.title !== "string") return undefined;
    if (record.description !== undefined && typeof record.description !== "string") return undefined;
    if (record.creator !== undefined && typeof record.creator !== "string") return undefined;
    if (record.milestones !== undefined && !Array.isArray(record.milestones)) return undefined;
    const milestones = (record.milestones ?? []) as unknown[];
    if (milestones.some((item) => !item || typeof item !== "object" || typeof (item as Record<string, unknown>).description !== "string" || typeof (item as Record<string, unknown>).amount !== "string")) return undefined;
    return {
      title: record.title as string | undefined ?? "",
      description: record.description as string | undefined ?? "",
      creator: record.creator as string | undefined ?? "",
      milestones: milestones as ContractDraftMilestone[]
    };
  } catch {
    return undefined;
  }
}

export function serializeContractDraft(draft: CreateContractDraft) {
  return JSON.stringify(draft);
}
