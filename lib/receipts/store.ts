import { createClient } from "@supabase/supabase-js";
import { loadSettlementReceipt } from "./chain";
import type { SettlementReceipt } from "./types";

export interface ReceiptStoreBackend {
  upsert(receipt: SettlementReceipt): Promise<void>;
  list(limit: number): Promise<SettlementReceipt[]>;
}

type StoreEnvironment = Record<string, string | undefined>;
type StoreDependencies = {
  env?: StoreEnvironment;
  backend?: ReceiptStoreBackend;
  loadReceipt?: typeof loadSettlementReceipt;
};

type ReceiptRow = {
  tx_hash: `0x${string}`;
  status: "confirmed";
  chain_id: number;
  block_number: string;
  confirmed_at: string;
  escrow_address: `0x${string}`;
  client_address: `0x${string}`;
  creator_address: `0x${string}`;
  milestone_index: number;
  milestone_description: string;
  amount_usdc: string;
  project_title: string;
  explorer_url: string;
};

function toRow(receipt: SettlementReceipt): ReceiptRow {
  return {
    tx_hash: receipt.txHash,
    status: receipt.status,
    chain_id: receipt.chainId,
    block_number: receipt.blockNumber,
    confirmed_at: receipt.confirmedAt,
    escrow_address: receipt.escrowAddress,
    client_address: receipt.clientAddress,
    creator_address: receipt.creatorAddress,
    milestone_index: receipt.milestoneIndex,
    milestone_description: receipt.milestoneDescription,
    amount_usdc: receipt.amountUsdc,
    project_title: receipt.projectTitle,
    explorer_url: receipt.explorerUrl
  };
}

function fromRow(row: ReceiptRow): SettlementReceipt {
  return {
    txHash: row.tx_hash,
    status: row.status,
    chainId: row.chain_id,
    blockNumber: row.block_number,
    confirmedAt: row.confirmed_at,
    escrowAddress: row.escrow_address,
    clientAddress: row.client_address,
    creatorAddress: row.creator_address,
    milestoneIndex: row.milestone_index,
    milestoneDescription: row.milestone_description,
    amountUsdc: row.amount_usdc,
    projectTitle: row.project_title,
    explorerUrl: row.explorer_url
  };
}

function createSupabaseBackend(env: StoreEnvironment): ReceiptStoreBackend | undefined {
  const url = env.SUPABASE_URL;
  const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return undefined;

  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return {
    async upsert(receipt) {
      const { error } = await client
        .from("settlement_receipts")
        .upsert(toRow(receipt), { onConflict: "tx_hash" });
      if (error) throw error;
    },
    async list(limit) {
      const { data, error } = await client
        .from("settlement_receipts")
        .select("tx_hash,status,chain_id,block_number,confirmed_at,escrow_address,client_address,creator_address,milestone_index,milestone_description,amount_usdc,project_title,explorer_url")
        .order("confirmed_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as ReceiptRow[] | null ?? []).map(fromRow);
    }
  };
}

function resolveBackend(dependencies: StoreDependencies) {
  if (dependencies.backend) return dependencies.backend;
  return createSupabaseBackend(dependencies.env ?? process.env);
}

export async function indexReceipt(txHash: string, dependencies: StoreDependencies = {}) {
  const backend = resolveBackend(dependencies);
  if (!backend) return { enabled: false as const, indexed: false as const };

  const receipt = await (dependencies.loadReceipt ?? loadSettlementReceipt)(txHash);
  await backend.upsert(receipt);
  return { enabled: true as const, indexed: true as const, receipt };
}

export async function listRecentReceipts(limit = 20, dependencies: StoreDependencies = {}) {
  const backend = resolveBackend(dependencies);
  if (!backend) return [];
  return backend.list(Math.min(20, Math.max(1, Math.trunc(limit))));
}
