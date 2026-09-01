import { indexReceipt, listRecentReceipts } from "@/lib/receipts/store";
import { ReceiptError } from "@/lib/receipts/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const requested = Number(new URL(request.url).searchParams.get("limit") ?? 20);
    const limit = Number.isFinite(requested) ? requested : 20;
    const receipts = await listRecentReceipts(limit);
    return Response.json({ receipts }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "RECEIPT_INDEX_UNAVAILABLE", receipts: [] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { txHash?: unknown } | null;
    if (typeof body?.txHash !== "string") {
      return Response.json({ error: "INVALID_TRANSACTION_HASH" }, { status: 400 });
    }

    const result = await indexReceipt(body.txHash);
    if (!result.enabled) return Response.json(result, { status: 202 });
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ReceiptError) {
      const status = error.code === "INVALID_TRANSACTION_HASH"
        ? 400
        : error.code === "RPC_UNAVAILABLE" || error.code === "TRANSACTION_NOT_FOUND"
          ? 503
          : 422;
      return Response.json({ error: error.code }, { status });
    }
    return Response.json({ error: "RECEIPT_INDEX_UNAVAILABLE" }, { status: 503 });
  }
}
