import assert from "node:assert/strict";
import test from "node:test";
import { encodeAbiParameters, encodeEventTopics } from "viem";
import {
  findCircleReleaseTransaction,
  readRecentReceiptHashes,
  saveRecentReceiptToStorage,
  selectReleaseTransaction,
  type StorageLike
} from "../lib/receipts/client";

const hashes = Array.from({ length: 22 }, (_, index) => `0x${index.toString(16).padStart(64, "0")}` as `0x${string}`);
const escrowAddress = "0x1000000000000000000000000000000000000000" as const;
const creatorAddress = "0x2000000000000000000000000000000000000000" as const;

class MemoryStorage implements StorageLike {
  value: string | null = null;
  getItem() { return this.value; }
  setItem(_key: string, value: string) { this.value = value; }
}

test("recent receipt history rejects invalid hashes, de-duplicates, and caps newest-first results", () => {
  const storage = new MemoryStorage();
  for (const hash of hashes) saveRecentReceiptToStorage(storage, hash);
  saveRecentReceiptToStorage(storage, hashes[21].toUpperCase());
  saveRecentReceiptToStorage(storage, "not-a-hash");

  const recent = readRecentReceiptHashes(storage);
  assert.equal(recent.length, 20);
  assert.equal(recent[0], hashes[21]);
  assert.equal(recent.at(-1), hashes[2]);
});

const paymentEvent = {
  type: "event",
  name: "PaymentReleased",
  inputs: [
    { indexed: true, name: "milestoneId", type: "uint256" },
    { indexed: true, name: "creator", type: "address" },
    { indexed: false, name: "amount", type: "uint256" }
  ]
} as const;

function log(input: { escrow?: `0x${string}`; creator?: `0x${string}`; milestone?: bigint; hash?: `0x${string}` } = {}) {
  const creator = input.creator ?? creatorAddress;
  const milestone = input.milestone ?? 2n;
  return {
    address: input.escrow ?? escrowAddress,
    transactionHash: input.hash ?? hashes[1],
    topics: encodeEventTopics({ abi: [paymentEvent], eventName: "PaymentReleased", args: { milestoneId: milestone, creator } }),
    data: encodeAbiParameters([{ type: "uint256" }], [425_000_000n])
  };
}

test("Circle release selection ignores the wrong escrow, milestone, and creator", () => {
  const expected = hashes[9];
  const selected = selectReleaseTransaction([
    log({ escrow: "0x4000000000000000000000000000000000000000" }),
    log({ milestone: 1n }),
    log({ creator: "0x5000000000000000000000000000000000000000" }),
    log({ hash: expected })
  ], { escrowAddress, creatorAddress, milestoneIndex: 2 });

  assert.equal(selected, expected);
});

test("Circle release tracking polls until the exact event appears", async () => {
  let calls = 0;
  const found = await findCircleReleaseTransaction({
    escrowAddress,
    creatorAddress,
    milestoneIndex: 2,
    attempts: 3,
    delayMs: 0,
    sleep: async () => {},
    loadLogs: async () => {
      calls += 1;
      return calls === 1 ? [log({ milestone: 1n })] : [log({ hash: hashes[8] })];
    }
  });

  assert.equal(found, hashes[8]);
  assert.equal(calls, 2);
});
