"use client";

import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

export type CircleSession = {
  userToken: string;
  encryptionKey: string;
  walletId: string;
  address: string;
};

const SESSION_KEY = "arc-circle-session";

export function saveCircleSession(session: CircleSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCircleSession(): CircleSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as CircleSession; } catch { return null; }
}

export function clearCircleSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function requestCircleContractExecution(input: {
  contractAddress: string;
  abiFunctionSignature: string;
  abiParameters?: Array<string | number | boolean | unknown[]>;
  refId?: string;
}) {
  const session = getCircleSession();
  if (!session) throw new Error("No active Circle wallet session. Open /wallet first.");

  const response = await fetch("/api/circle/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "contractExecution",
      userToken: session.userToken,
      walletId: session.walletId,
      contractAddress: input.contractAddress,
      abiFunctionSignature: input.abiFunctionSignature,
      abiParameters: input.abiParameters ?? [],
      refId: input.refId ?? "arc-creator-settlement"
    })
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.message || data?.error || "Circle transaction request failed"), data);
  if (!data.challengeId) throw new Error("Circle returned no challengeId.");

  const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
  if (!appId) throw new Error("NEXT_PUBLIC_CIRCLE_APP_ID is missing.");
  const sdk = new W3SSdk({ appSettings: { appId } });
  sdk.setAuthentication({ userToken: session.userToken, encryptionKey: session.encryptionKey });

  await new Promise<void>((resolve, reject) => {
    sdk.execute(data.challengeId, (error) => error ? reject(error) : resolve());
  });

  return data.challengeId as string;
}
