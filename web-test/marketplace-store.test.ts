import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteLocalContract,
  getApplicationForWallet,
  getApplications,
  getContractsForWallet,
  hideContractForWallet,
  isContractHidden,
  isWalletCreator,
  isWalletOwner,
  saveApplication,
  type JobApplication,
  type LocalContract,
  type StorageLike
} from "../lib/marketplace-store";
import {
  contractsForWallet,
  loadPublicMarketplaceContracts,
  mergeMarketplaceContracts,
  sumEscrowBalances,
  sumContractTotals
} from "../lib/marketplace-chain";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const advertiser = "0xAAAA000000000000000000000000000000000001";
const applicant = "0xBBBB000000000000000000000000000000000002";
const contract: LocalContract = {
  id: "contract-1",
  title: "Design campaign",
  advertiser,
  creator: "0xCCCC000000000000000000000000000000000003",
  totalUsdc: "100",
  status: "Created"
};

const application: JobApplication = {
  id: "application-1",
  contractId: contract.id,
  applicant,
  status: "Applied",
  appliedAt: "2026-09-07T00:00:00.000Z"
};

test("malformed marketplace storage is read as empty arrays", () => {
  const storage = new MemoryStorage();
  storage.setItem("arc-job-applications", "not-json");
  storage.setItem("arc-settlement-contracts", "{\"unexpected\":true}");

  assert.deepEqual(getApplications(storage), []);
  assert.deepEqual(getContractsForWallet(applicant, storage), []);
});

test("saving an application persists and returns the normalized record", () => {
  const storage = new MemoryStorage();
  const result = saveApplication(application, { storage, contracts: [contract] });

  assert.deepEqual(result, { ok: true, application });
  assert.deepEqual(getApplications(storage), [application]);
});

test("saving an application rejects a duplicate wallet and contract pair", () => {
  const storage = new MemoryStorage();
  saveApplication(application, { storage, contracts: [contract] });

  const duplicate = saveApplication({ ...application, id: "another-id", applicant: applicant.toLowerCase() }, { storage, contracts: [contract] });
  assert.deepEqual(duplicate, { ok: false, error: "duplicate" });
});

test("saving an application rejects the contract owner", () => {
  const storage = new MemoryStorage();
  const result = saveApplication({ ...application, applicant: advertiser }, { storage, contracts: [contract] });

  assert.deepEqual(result, { ok: false, error: "owner" });
  assert.deepEqual(getApplications(storage), []);
});

test("wallet matching is case insensitive for owner and contract filtering", () => {
  const storage = new MemoryStorage();
  storage.setItem("arc-settlement-contracts", JSON.stringify([contract]));

  assert.equal(isWalletOwner(advertiser.toLowerCase(), contract), true);
  assert.deepEqual(getContractsForWallet(advertiser.toLowerCase(), storage), [contract]);
});

test("creator wallets can recover assigned public escrows", () => {
  const assigned = { ...contract, id: "0xassigned", escrowAddress: "0xassigned", advertiser, creator: applicant };
  assert.equal(isWalletCreator(applicant.toLowerCase(), assigned), true);
  assert.deepEqual(contractsForWallet(applicant.toLowerCase(), [assigned], []), [assigned]);
});

test("legacy contracts remain visible when owner metadata was not persisted", () => {
  const storage = new MemoryStorage();
  const legacy = { ...contract, advertiser: undefined, creator: advertiser };
  storage.setItem("arc-settlement-contracts", JSON.stringify([legacy]));

  const persistedLegacy = { ...legacy };
  delete persistedLegacy.advertiser;
  assert.deepEqual(getContractsForWallet(advertiser.toLowerCase(), storage), [persistedLegacy]);
});

test("deletes a local pending contract without touching other contracts", () => {
  const storage = new MemoryStorage();
  const pending = { ...contract, id: "pending-1", escrowAddress: undefined };
  storage.setItem("arc-settlement-contracts", JSON.stringify([pending, contract]));

  assert.equal(deleteLocalContract(pending, storage), true);
  assert.deepEqual(getContractsForWallet(advertiser, storage), [contract]);
});

test("hides an onchain contract for one wallet without deleting its record", () => {
  const storage = new MemoryStorage();
  const onchain = { ...contract, id: "0x1111111111111111111111111111111111111111", escrowAddress: "0x1111111111111111111111111111111111111111" };
  storage.setItem("arc-settlement-contracts", JSON.stringify([onchain]));

  assert.equal(hideContractForWallet(advertiser, onchain, storage), true);
  assert.equal(isContractHidden(advertiser, onchain, storage), true);
  assert.equal(isContractHidden(applicant, onchain, storage), false);
  assert.deepEqual(getContractsForWallet(advertiser, storage), [onchain]);
});

test("restores an application for the connected wallet across contract id aliases", () => {
  const storage = new MemoryStorage();
  const application: JobApplication = {
    id: "application-1",
    contractId: "0xABCDEF0000000000000000000000000000000001",
    applicant: applicant.toUpperCase(),
    status: "Applied",
    appliedAt: "2026-09-08T00:00:00.000Z"
  };
  storage.setItem("arc-job-applications", JSON.stringify([application]));

  assert.deepEqual(
    getApplicationForWallet(applicant, ["pending-local-id", "0xabcdef0000000000000000000000000000000001"], storage),
    application
  );
});

test("public chain contracts remain visible when the browser has no local records", () => {
  const publicContract: LocalContract = {
    id: "0xescrow",
    escrowAddress: "0xescrow",
    title: "Create and Publish Content About Arc Network",
    creator: advertiser,
    advertiser,
    totalUsdc: "50",
    status: "Created"
  };

  assert.deepEqual(mergeMarketplaceContracts([publicContract], []), [publicContract]);
});

test("wallet workspace includes public contracts created by the connected wallet", () => {
  const publicContract: LocalContract = {
    id: "0xpublic-escrow",
    escrowAddress: "0xpublic-escrow",
    title: "Create and Publish Content About Arc Network",
    creator: advertiser,
    advertiser,
    owner: advertiser,
    totalUsdc: "1,000",
    status: "Created"
  };

  assert.deepEqual(contractsForWallet(advertiser.toLowerCase(), [publicContract], []), [publicContract]);
});

test("sums formatted public contract totals without producing NaN", () => {
  assert.equal(sumContractTotals([{ totalUsdc: "50" }, { totalUsdc: "1,000" }]), 1050);
});

test("sums only known onchain escrow balances", () => {
  const result = sumEscrowBalances([{ escrowBalanceUsdc: "0.1" }, { escrowBalanceUsdc: "1" }, {}]);
  assert.equal(result.known, 2);
  assert.equal(result.value, 1_100_000n);
});

test("loads public contracts from the deployed factory registry", async () => {
  const escrow = "0x1111111111111111111111111111111111111111";
  const fakeClient = {
    readContract: async ({ functionName }: { functionName: string }) => {
      if (functionName === "escrowCount") return 1n;
      if (functionName === "escrows") return escrow;
      if (functionName === "title") return "Create and Publish Content About Arc Network";
      if (functionName === "creator") return advertiser;
      if (functionName === "client") return advertiser;
      if (functionName === "totalAmount") return 50_000_000n;
      if (functionName === "status") return 0;
      throw new Error(`Unexpected read: ${functionName}`);
    }
  };

  assert.deepEqual(await loadPublicMarketplaceContracts(fakeClient as never), [{
    id: escrow,
    escrowAddress: escrow,
    title: "Create and Publish Content About Arc Network",
    creator: advertiser,
    advertiser,
    owner: advertiser,
    totalUsdc: "50",
    status: "Created"
  }]);
});
