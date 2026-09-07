import assert from "node:assert/strict";
import test from "node:test";
import {
  getApplications,
  getContractsForWallet,
  isWalletOwner,
  saveApplication,
  type JobApplication,
  type LocalContract,
  type StorageLike
} from "../lib/marketplace-store";

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

test("legacy contracts remain visible when owner metadata was not persisted", () => {
  const storage = new MemoryStorage();
  const legacy = { ...contract, advertiser: undefined, creator: advertiser };
  storage.setItem("arc-settlement-contracts", JSON.stringify([legacy]));

  const persistedLegacy = { ...legacy };
  delete persistedLegacy.advertiser;
  assert.deepEqual(getContractsForWallet(advertiser.toLowerCase(), storage), [persistedLegacy]);
});
