import assert from "node:assert/strict";
import test from "node:test";
import {
  enrichContractDescriptions,
  fetchContractMetadata,
  mergeContractDescriptions,
  normalizeContractMetadataRows,
  saveContractMetadata,
  type ContractMetadata
} from "../lib/marketplace-metadata";
import {
  createContractMetadata,
  listContractMetadata,
  type ContractMetadataBackend
} from "../lib/marketplace-metadata-store";
import { createMetadataRouteHandlers } from "../lib/marketplace-metadata-route";
import type { LocalContract } from "../lib/marketplace-store";

const escrow = "0x1111111111111111111111111111111111111111";
const advertiser = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const description = "Create a Korean Arc onboarding video for new builders.";
const now = "2026-09-12T00:00:00.000Z";

const row = {
  escrow_address: escrow.toUpperCase().replace("0X", "0x"),
  advertiser_wallet: advertiser.toUpperCase().replace("0X", "0x"),
  description,
  created_at: now,
  updated_at: now
};

test("metadata normalization accepts safe public rows and rejects malformed values", () => {
  const normalized = normalizeContractMetadataRows([
    row,
    { ...row, escrow_address: "not-an-address" },
    { ...row, description: "short" },
    { ...row, description: "A".repeat(2_001) },
    { ...row, advertiser_wallet: "0x1234" }
  ]);

  assert.deepEqual(normalized, [{
    escrowAddress: escrow,
    advertiserWallet: advertiser.toLowerCase(),
    description,
    createdAt: now,
    updatedAt: now
  }]);
});

test("metadata enrichment adds only descriptions and preserves onchain fields", () => {
  const contract: LocalContract = {
    id: escrow,
    escrowAddress: escrow,
    title: "Onchain title",
    creator: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    advertiser,
    totalUsdc: "25",
    status: "Funded"
  };
  const metadata: ContractMetadata = {
    escrowAddress: escrow.toUpperCase().replace("0X", "0x"),
    advertiserWallet: advertiser.toLowerCase(),
    description,
    createdAt: now,
    updatedAt: now
  };

  assert.deepEqual(mergeContractDescriptions([contract], [metadata]), [{ ...contract, description }]);
  assert.deepEqual(mergeContractDescriptions([contract], []), [contract]);
});

test("metadata enrichment keeps Arc listings visible when metadata is unavailable", async () => {
  const contract: LocalContract = {
    id: escrow,
    escrowAddress: escrow,
    title: "Onchain title",
    creator: advertiser,
    advertiser,
    totalUsdc: "25",
    status: "Created"
  };

  assert.deepEqual(await enrichContractDescriptions([contract], async () => {
    throw new Error("metadata offline");
  }), [contract]);
});

test("metadata browser client accepts the camel-case API response for reads and writes", async () => {
  const metadata: ContractMetadata = {
    escrowAddress: escrow,
    advertiserWallet: advertiser.toLowerCase(),
    description,
    createdAt: now,
    updatedAt: now
  };
  const readFetch = async () => Response.json({ enabled: true, metadata: [metadata] });
  const writeFetch = async () => Response.json({ created: true, metadata }, { status: 201 });

  assert.deepEqual(await fetchContractMetadata([escrow], readFetch as typeof fetch), [metadata]);
  assert.deepEqual(await saveContractMetadata({ escrowAddress: escrow, advertiserWallet: advertiser, description }, writeFetch as typeof fetch), metadata);
});

function memoryBackend(existing?: typeof row): ContractMetadataBackend & { inserted: typeof row[] } {
  const inserted: typeof row[] = [];
  return {
    inserted,
    async list() { return existing ? [existing] : []; },
    async find() { return existing; },
    async insert(value) { inserted.push(value); return value; }
  };
}

test("metadata storage remains disabled without server Supabase configuration", async () => {
  assert.deepEqual(await listContractMetadata([escrow], { env: {} }), { enabled: false, metadata: [] });
  assert.deepEqual(await createContractMetadata({ escrowAddress: escrow, advertiserWallet: advertiser, description }, { env: {} }), { ok: false, error: "METADATA_UNAVAILABLE" });
});

test("metadata storage verifies the advertiser on Arc before inserting", async () => {
  const backend = memoryBackend();
  const result = await createContractMetadata(
    { escrowAddress: escrow.toUpperCase().replace("0X", "0x"), advertiserWallet: advertiser, description: `  ${description}  ` },
    {
      backend,
      chainClient: { readContract: async () => advertiser.toLowerCase() }
    }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(backend.inserted, [{
    escrow_address: escrow,
    advertiser_wallet: advertiser.toLowerCase(),
    description,
    created_at: backend.inserted[0]?.created_at,
    updated_at: backend.inserted[0]?.updated_at
  }]);

  assert.deepEqual(await createContractMetadata(
    { escrowAddress: escrow, advertiserWallet: advertiser, description },
    {
      backend: memoryBackend(),
      chainClient: { readContract: async () => "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" }
    }
  ), { ok: false, error: "ADVERTISER_MISMATCH" });
});

test("metadata storage is idempotent but rejects conflicting replacement content", async () => {
  const chainClient = { readContract: async () => advertiser.toLowerCase() };

  const same = await createContractMetadata(
    { escrowAddress: escrow, advertiserWallet: advertiser, description },
    { backend: memoryBackend(row), chainClient }
  );
  assert.equal(same.ok, true);
  if (same.ok) assert.equal(same.created, false);

  assert.deepEqual(await createContractMetadata(
    { escrowAddress: escrow, advertiserWallet: advertiser, description: "A different description that is long enough to pass." },
    { backend: memoryBackend(row), chainClient }
  ), { ok: false, error: "METADATA_CONFLICT" });
});

test("metadata route validates batches and request bodies before calling storage", async () => {
  let createCalls = 0;
  const { GET, POST } = createMetadataRouteHandlers({
    list: async (addresses) => ({ enabled: true, metadata: addresses.map((address) => ({
      escrowAddress: address,
      advertiserWallet: advertiser.toLowerCase(),
      description,
      createdAt: now,
      updatedAt: now
    })) }),
    create: async () => { createCalls += 1; return { ok: false as const, error: "ADVERTISER_MISMATCH" as const }; }
  });

  const invalidGet = await GET(new Request("http://localhost/api/contracts/metadata?escrowAddresses=bad"));
  assert.equal(invalidGet.status, 400);

  const validGet = await GET(new Request(`http://localhost/api/contracts/metadata?escrowAddresses=${escrow},${escrow.toUpperCase().replace("0X", "0x")}`));
  assert.equal(validGet.status, 200);
  assert.equal(((await validGet.json()) as { metadata: unknown[] }).metadata.length, 1);

  const invalidPost = await POST(new Request("http://localhost/api/contracts/metadata", {
    method: "POST",
    body: JSON.stringify({ escrowAddress: escrow, advertiserWallet: advertiser, description: "short" })
  }));
  assert.equal(invalidPost.status, 400);
  assert.equal(createCalls, 0);

  const mismatch = await POST(new Request("http://localhost/api/contracts/metadata", {
    method: "POST",
    body: JSON.stringify({ escrowAddress: escrow, advertiserWallet: advertiser, description })
  }));
  assert.equal(mismatch.status, 403);
  assert.equal(createCalls, 1);
});
