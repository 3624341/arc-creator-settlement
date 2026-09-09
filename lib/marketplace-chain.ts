import { ESCROW_FACTORY_ADDRESS } from "./arc";
import { escrowAbi, factoryAbi } from "./abi";
import { getPublicClient } from "./browser-wallet";
import { erc20Abi } from "./abi";
import { formatUsdc, formatUsdcExact, parseUsdc } from "./format";
import { ARC_USDC_ADDRESS } from "./arc";
import { isWalletCreator, isWalletOwner, type LocalContract } from "./marketplace-store";

// The deployed factory is public infrastructure for this testnet MVP. Keep the
// fallback so public listings work even when a local environment omits the env var.
export const DEPLOYED_ESCROW_FACTORY_ADDRESS = "0x5b90cdfecf1c59596e0b6b9cae448a29c2774e32" as `0x${string}`;
const MAX_PUBLIC_LISTINGS = 100;

type ReadClient = Pick<ReturnType<typeof getPublicClient>, "readContract">;

function contractStatus(value: unknown): LocalContract["status"] {
  const status = Number(value);
  if (status === 1) return "Funded";
  if (status === 2) return "Completed";
  if (status === 3) return "Cancelled";
  return "Created";
}

export function mergeMarketplaceContracts(publicContracts: LocalContract[], localContracts: LocalContract[]) {
  const merged = new Map<string, LocalContract>();
  for (const contract of [...localContracts, ...publicContracts]) {
    const key = (contract.escrowAddress ?? contract.id).toLowerCase();
    const previous = merged.get(key);
    merged.set(key, previous
      ? { ...previous, ...contract, applications: contract.applications ?? previous.applications }
      : contract);
  }
  return [...merged.values()];
}

export function contractsForWallet(wallet: string, publicContracts: LocalContract[], localContracts: LocalContract[]) {
  return mergeMarketplaceContracts(publicContracts, localContracts).filter((contract) => isWalletOwner(wallet, contract) || isWalletCreator(wallet, contract));
}

export function sumContractTotals(contracts: Pick<LocalContract, "totalUsdc">[]) {
  return contracts.reduce((sum, contract) => {
    const value = Number(String(contract.totalUsdc ?? "0").replaceAll(",", ""));
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

export function sumEscrowBalances(contracts: Pick<LocalContract, "escrowBalanceUsdc">[]) {
  let value = 0n;
  let known = 0;
  for (const contract of contracts) {
    if (typeof contract.escrowBalanceUsdc !== "string") continue;
    try {
      value += parseUsdc(contract.escrowBalanceUsdc);
      known += 1;
    } catch {
      // Ignore malformed cached balances; the dashboard will show an unknown total.
    }
  }
  return { value, known };
}

async function readPublicContract(client: ReadClient, escrowAddress: `0x${string}`): Promise<LocalContract | undefined> {
  try {
    const [title, creator, advertiser, totalAmount, status] = await Promise.all([
      client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: "title" }),
      client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: "creator" }),
      client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: "client" }),
      client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: "totalAmount" }),
      client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: "status" })
    ]);

    let escrowBalanceUsdc: string | undefined;
    try {
      const balance = await client.readContract({ address: ARC_USDC_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [escrowAddress] });
      escrowBalanceUsdc = formatUsdcExact(balance as bigint);
    } catch {
      // A temporary token RPC failure must not turn a valid escrow into a fake listing.
    }

    return {
      id: escrowAddress,
      escrowAddress,
      title: String(title),
      creator: String(creator),
      advertiser: String(advertiser),
      owner: String(advertiser),
      totalUsdc: formatUsdc(BigInt(totalAmount as bigint)),
      status: contractStatus(status),
      ...(escrowBalanceUsdc !== undefined ? { escrowBalanceUsdc } : {})
    };
  } catch {
    return undefined;
  }
}

export async function loadPublicMarketplaceContracts(client: ReadClient = getPublicClient()): Promise<LocalContract[]> {
  const factory = (ESCROW_FACTORY_ADDRESS ?? DEPLOYED_ESCROW_FACTORY_ADDRESS) as `0x${string}`;
  const count = Number(await client.readContract({ address: factory, abi: factoryAbi, functionName: "escrowCount" }));
  const start = Math.max(0, count - MAX_PUBLIC_LISTINGS);
  const addresses = await Promise.all(
    Array.from({ length: count - start }, (_, offset) =>
      client.readContract({ address: factory, abi: factoryAbi, functionName: "escrows", args: [BigInt(start + offset)] })
    )
  );
  const contracts = await Promise.all(addresses.map((address) => readPublicContract(client, address as `0x${string}`)));
  return contracts.filter((contract): contract is LocalContract => Boolean(contract)).reverse();
}
