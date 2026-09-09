import { parseUsdc } from "./format";

export type ContractDraftMilestone = { description: string; amount: string };

export function validateContractDraft(title: string, creator: string, milestones: ContractDraftMilestone[]) {
  if (!title.trim()) return "Enter a project title.";
  if (!/^0x[a-fA-F0-9]{40}$/.test(creator.trim())) return "Enter a valid creator wallet address.";
  if (milestones.length === 0) return "Add at least one milestone.";
  if (milestones.some((milestone) => {
    if (!milestone.description.trim() || !/^\d+(\.\d{1,6})?$/.test(milestone.amount.trim())) return true;
    try {
      return parseUsdc(milestone.amount) <= 0n;
    } catch {
      return true;
    }
  })) return "Every milestone needs a description and a positive USDC amount (up to 6 decimals).";
  return undefined;
}
