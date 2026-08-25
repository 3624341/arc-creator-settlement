import { NextResponse } from "next/server";

const CIRCLE_BASE_URL = "https://api.circle.com";
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;

function authHeaders(userToken?: string) {
  if (!CIRCLE_API_KEY) throw new Error("CIRCLE_API_KEY is not configured");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CIRCLE_API_KEY}`,
    ...(userToken ? { "X-User-Token": userToken } : {})
  };
}

async function circleFetch(path: string, init: RequestInit) {
  const response = await fetch(`${CIRCLE_BASE_URL}${path}`, { ...init, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }
  return NextResponse.json(data.data ?? data, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body ?? {};

    switch (action) {
      case "createUser": {
        if (!params.userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        return circleFetch("/v1/w3s/users", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ userId: params.userId })
        });
      }

      case "getUserToken": {
        if (!params.userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        return circleFetch("/v1/w3s/users/token", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ userId: params.userId })
        });
      }

      case "initializeUser": {
        if (!params.userToken) return NextResponse.json({ error: "Missing userToken" }, { status: 400 });
        return circleFetch("/v1/w3s/user/initialize", {
          method: "POST",
          headers: authHeaders(params.userToken),
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(),
            accountType: "SCA",
            blockchains: ["ARC-TESTNET"]
          })
        });
      }

      case "listWallets": {
        if (!params.userToken) return NextResponse.json({ error: "Missing userToken" }, { status: 400 });
        return circleFetch("/v1/w3s/wallets", {
          method: "GET",
          headers: authHeaders(params.userToken)
        });
      }

      case "getTokenBalance": {
        if (!params.userToken || !params.walletId) {
          return NextResponse.json({ error: "Missing userToken or walletId" }, { status: 400 });
        }
        return circleFetch(`/v1/w3s/wallets/${params.walletId}/balances`, {
          method: "GET",
          headers: authHeaders(params.userToken)
        });
      }

      case "contractExecution": {
        const { userToken, walletId, contractAddress, abiFunctionSignature, abiParameters, callData, refId } = params;
        if (!userToken || !walletId || !contractAddress) {
          return NextResponse.json({ error: "Missing contract execution parameters" }, { status: 400 });
        }
        if (!abiFunctionSignature && !callData) {
          return NextResponse.json({ error: "abiFunctionSignature or callData is required" }, { status: 400 });
        }
        return circleFetch("/v1/w3s/user/transactions/contractExecution", {
          method: "POST",
          headers: authHeaders(userToken),
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(),
            walletId,
            contractAddress,
            ...(callData ? { callData } : { abiFunctionSignature, abiParameters: abiParameters ?? [] }),
            feeLevel: "MEDIUM",
            refId: refId ?? "arc-creator-settlement"
          })
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Circle API route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
