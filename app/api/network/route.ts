import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { ARC_RPC_URL, arcTestnet } from "@/lib/arc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
    const blockNumber = await client.getBlockNumber();
    return NextResponse.json({ chainId: arcTestnet.id, blockNumber: blockNumber.toString() });
  } catch {
    return NextResponse.json({ error: "Arc RPC unavailable" }, { status: 503 });
  }
}
