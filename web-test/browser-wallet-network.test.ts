import assert from "node:assert/strict";
import test from "node:test";
import { ensureBaseSepoliaNetwork } from "../lib/browser-wallet";

type Request = { method: string; params?: unknown[] };

function providerFor(
  handler: (request: Request) => Promise<unknown>,
) {
  return { request: handler };
}

test("Base Sepolia 전환은 현재 provider에 chain switch 요청을 보낸다", async () => {
  const requests: Request[] = [];
  const provider = providerFor(async (request) => {
    requests.push(request);
    return null;
  });

  await ensureBaseSepoliaNetwork(provider);

  assert.deepEqual(requests, [
    {
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x14a34" }],
    },
  ]);
});

test("Base Sepolia가 지갑에 없으면 chain add 요청으로 등록한다", async () => {
  const requests: Request[] = [];
  const provider = providerFor(async (request) => {
    requests.push(request);
    if (request.method === "wallet_switchEthereumChain") {
      const error = Object.assign(new Error("Unrecognized chain"), { code: 4902 });
      throw error;
    }
    return null;
  });

  await ensureBaseSepoliaNetwork(provider);

  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], {
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x14a34" }],
  });
  assert.deepEqual(requests[1], {
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: "0x14a34",
        chainName: "Base Sepolia",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://sepolia.base.org"],
        blockExplorerUrls: ["https://sepolia.basescan.org"],
      },
    ],
  });
});

test("사용자가 Base Sepolia 전환을 거절하면 원래 오류를 전달한다", async () => {
  const rejection = Object.assign(new Error("User rejected"), { code: 4001 });
  const provider = providerFor(async () => {
    throw rejection;
  });

  await assert.rejects(ensureBaseSepoliaNetwork(provider), rejection);
});
