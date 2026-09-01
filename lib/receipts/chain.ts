import {
  createPublicClient,
  decodeEventLog,
  formatUnits,
  getAddress,
  http,
  type Address,
  type Hex
} from "viem";
import { escrowAbi } from "../abi";
import { ARC_CHAIN_ID, ARC_EXPLORER_URL, ARC_RPC_URL, arcTestnet } from "../arc";
import { ReceiptError, type SettlementReceipt } from "./types";

const TRANSACTION_HASH = /^0x[a-fA-F0-9]{64}$/;

export type ReceiptLog = {
  address: Address;
  data: Hex;
  topics: readonly Hex[];
  transactionHash?: Hex | null;
};

export interface ReceiptDataSource {
  getTransactionReceipt(hash: Hex): Promise<{
    status: "success" | "reverted";
    blockNumber: bigint;
    logs: readonly ReceiptLog[];
  }>;
  getBlock(blockNumber: bigint): Promise<{ timestamp: bigint }>;
  readContract(input: {
    address: Address;
    functionName: "client" | "creator" | "title" | "getMilestone";
    args?: readonly unknown[];
    blockNumber: bigint;
  }): Promise<unknown>;
}

export type DecodedPaymentReleased = {
  escrowAddress: Address;
  txHash: Hex;
  milestoneIndex: bigint;
  creatorAddress: Address;
  amount: bigint;
};

export function decodePaymentReleasedLog(log: ReceiptLog): DecodedPaymentReleased | null {
  try {
    const decoded = decodeEventLog({
      abi: escrowAbi,
      eventName: "PaymentReleased",
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
      strict: true
    });
    const args = decoded.args as { milestoneId: bigint; creator: Address; amount: bigint };
    if (!log.transactionHash) return null;
    return {
      escrowAddress: getAddress(log.address),
      txHash: log.transactionHash,
      milestoneIndex: args.milestoneId,
      creatorAddress: getAddress(args.creator),
      amount: args.amount
    };
  } catch {
    return null;
  }
}

function createArcReceiptSource(): ReceiptDataSource {
  const client = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
  return {
    async getTransactionReceipt(hash) {
      return client.getTransactionReceipt({ hash });
    },
    async getBlock(blockNumber) {
      return client.getBlock({ blockNumber });
    },
    async readContract({ address, functionName, args, blockNumber }) {
      return client.readContract({
        address,
        abi: escrowAbi,
        functionName,
        args: args as never,
        blockNumber
      } as never);
    }
  };
}

function sameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

export async function loadSettlementReceipt(
  txHash: string,
  source: ReceiptDataSource = createArcReceiptSource()
): Promise<SettlementReceipt> {
  if (!TRANSACTION_HASH.test(txHash)) {
    throw new ReceiptError("INVALID_TRANSACTION_HASH");
  }

  const hash = txHash as Hex;
  let transaction;
  try {
    transaction = await source.getTransactionReceipt(hash);
  } catch (cause) {
    throw new ReceiptError("TRANSACTION_NOT_FOUND", { cause });
  }

  if (transaction.status !== "success") {
    throw new ReceiptError("TRANSACTION_REVERTED");
  }

  const releases = transaction.logs
    .map((log) => decodePaymentReleasedLog(log))
    .filter((log): log is DecodedPaymentReleased => Boolean(log));

  if (releases.length === 0) throw new ReceiptError("PAYMENT_EVENT_NOT_FOUND");
  if (releases.length > 1) throw new ReceiptError("PAYMENT_EVENT_AMBIGUOUS");

  const release = releases[0];
  try {
    const [clientAddress, creatorAddress, projectTitle, milestone, block] = await Promise.all([
      source.readContract({ address: release.escrowAddress, functionName: "client", blockNumber: transaction.blockNumber }),
      source.readContract({ address: release.escrowAddress, functionName: "creator", blockNumber: transaction.blockNumber }),
      source.readContract({ address: release.escrowAddress, functionName: "title", blockNumber: transaction.blockNumber }),
      source.readContract({ address: release.escrowAddress, functionName: "getMilestone", args: [release.milestoneIndex], blockNumber: transaction.blockNumber }),
      source.getBlock(transaction.blockNumber)
    ]);

    const [milestoneDescription, milestoneAmount, , , released] = milestone as readonly [string, bigint, boolean, boolean, boolean];
    if (
      typeof clientAddress !== "string" ||
      typeof creatorAddress !== "string" ||
      typeof projectTitle !== "string" ||
      !sameAddress(creatorAddress, release.creatorAddress) ||
      milestoneAmount !== release.amount ||
      released !== true
    ) {
      throw new ReceiptError("CONTRACT_STATE_MISMATCH");
    }

    return {
      txHash: hash,
      status: "confirmed",
      chainId: ARC_CHAIN_ID,
      blockNumber: transaction.blockNumber.toString(),
      confirmedAt: new Date(Number(block.timestamp) * 1000).toISOString(),
      escrowAddress: getAddress(release.escrowAddress),
      clientAddress: getAddress(clientAddress),
      creatorAddress: getAddress(creatorAddress),
      milestoneIndex: Number(release.milestoneIndex),
      milestoneDescription,
      amountUsdc: formatUnits(release.amount, 6),
      projectTitle,
      explorerUrl: `${ARC_EXPLORER_URL}/tx/${hash}`
    };
  } catch (cause) {
    if (cause instanceof ReceiptError) throw cause;
    throw new ReceiptError("RPC_UNAVAILABLE", { cause });
  }
}
