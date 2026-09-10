# Marketplace Visibility and Saved Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add wallet-scoped job hiding, an Archived Jobs restore flow, and star-based Saved Jobs across Dashboard and My Page.

**Architecture:** Keep personal preferences in browser `localStorage`, using the existing normalized wallet/job key format. Dashboard and My Page will resolve the active wallet and derive visible, archived, and saved contract lists from the same merged public/local contract set. Onchain contracts are never deleted or mutated by these controls.

**Tech Stack:** Next.js App Router, React client components, TypeScript, `localStorage`, `lucide-react`, Node test runner via `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-10-marketplace-preferences-design.md`

## Global Constraints

- Preserve the existing `HIDDEN_CONTRACTS_STORAGE_KEY` format and wallet isolation.
- Keep local draft deletion separate from deployed-job hiding.
- Do not add Supabase tables or expose private wallet data.
- Do not render a saved preference when no wallet is connected.
- Run focused tests before broad tests and run `npm run build` before completion.

---

### Task 1: Add marketplace preference helpers

**Files:**
- Modify: `lib/marketplace-store.ts`
- Test: `web-test/marketplace-store.test.ts`

**Interfaces:**
- Produces `getHiddenContractsForWallet`, `restoreContractForWallet`, `saveContractForWallet`, `unsaveContractForWallet`, `isContractSaved`, and `getSavedContractsForWallet`.
- All helpers accept `(wallet, contract[, storage])` or `(wallet, contracts[, storage])` exactly as defined in the approved spec.

- [ ] **Step 1: Add failing storage tests**

Add tests that create two wallets and an onchain contract, then assert:

```ts
test("restores hidden contracts and returns them from the archive list", () => {
  const storage = new MemoryStorage();
  const onchain = { ...contract, id: "0x1111111111111111111111111111111111111111", escrowAddress: "0x1111111111111111111111111111111111111111" };
  hideContractForWallet(advertiser, onchain, storage);
  assert.deepEqual(getHiddenContractsForWallet(advertiser, [onchain], storage), [onchain]);
  assert.equal(restoreContractForWallet(advertiser.toLowerCase(), onchain, storage), true);
  assert.deepEqual(getHiddenContractsForWallet(advertiser, [onchain], storage), []);
});

test("saves and unsaves jobs per wallet without affecting another wallet", () => {
  const storage = new MemoryStorage();
  saveContractForWallet(advertiser, contract, storage);
  assert.equal(isContractSaved(advertiser.toLowerCase(), contract, storage), true);
  assert.deepEqual(getSavedContractsForWallet(advertiser, [contract], storage), [contract]);
  assert.deepEqual(getSavedContractsForWallet(applicant, [contract], storage), []);
  assert.equal(unsaveContractForWallet(advertiser, contract, storage), true);
  assert.equal(isContractSaved(advertiser, contract, storage), false);
});

test("saved and hidden preference helpers ignore malformed storage and aliases", () => {
  const storage = new MemoryStorage();
  storage.setItem("arc-hidden-contracts", "not-json");
  storage.setItem("arc-saved-contracts", JSON.stringify([`${advertiser.toLowerCase()}:0xabcdef0000000000000000000000000000000001` , "bad"]));
  const alias = { ...contract, id: "local-id", escrowAddress: "0xABCDEF0000000000000000000000000000000001" };
  assert.deepEqual(getHiddenContractsForWallet(advertiser, [alias], storage), []);
  assert.deepEqual(getSavedContractsForWallet(advertiser, [alias], storage), [alias]);
});
```

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run: `npm run test:web -- web-test/marketplace-store.test.ts`

Expected: FAIL because the new helper exports do not exist yet.

- [ ] **Step 3: Implement the saved-key helpers**

In `lib/marketplace-store.ts`:

1. Export `SAVED_CONTRACTS_STORAGE_KEY = "arc-saved-contracts"`.
2. Reuse `hiddenContractKey` for both preference stores.
3. Add a private `readPreferenceKeys(storage, key)` that reads string arrays, catches malformed JSON, and returns `[]`.
4. Add a private `writePreferenceKeys(storage, key, keys)` that writes a de-duplicated array and returns `false` on storage failure.
5. Implement restore by removing the normalized hidden key.
6. Implement save by appending the normalized saved key only when wallet and storage are available.
7. Implement unsave by removing the normalized saved key.
8. Implement the list functions by filtering the supplied contracts with the corresponding predicate.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm run test:web -- web-test/marketplace-store.test.ts`

Expected: PASS, including the existing hide/delete/application tests.

- [ ] **Step 5: Commit the storage layer**

```bash
git add lib/marketplace-store.ts web-test/marketplace-store.test.ts
git commit -m "feat: add wallet-scoped marketplace preferences"
```

### Task 2: Add Dashboard filtering and ContractCard star control

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `components/ContractCard.tsx`
- Test: `web-test/marketplace-ui.test.ts`

**Interfaces:**
- `ContractCard` receives `wallet?: string` and `onSavedChange?: (saved: boolean) => void`.
- Dashboard keeps its existing public no-wallet behavior and filters only the connected wallet's hidden contracts.

- [ ] **Step 1: Add failing UI/source assertions**

Add assertions for the required imports and behavior:

```ts
test("dashboard filters wallet-hidden contracts and cards expose saved-job controls", () => {
  const dashboard = readFileSync(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8");
  const card = readFileSync(new URL("../components/ContractCard.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /isContractHidden/);
  assert.match(dashboard, /getCircleSession/);
  assert.match(dashboard, /arc-browser-wallet/);
  assert.match(card, /isContractSaved/);
  assert.match(card, /saveContractForWallet/);
  assert.match(card, /unsaveContractForWallet/);
  assert.match(card, /aria-pressed/);
  assert.match(card, /Save job/);
});
```

- [ ] **Step 2: Run the focused UI test and verify the expected failure**

Run: `npm run test:web -- web-test/marketplace-ui.test.ts`

Expected: FAIL because Dashboard and ContractCard do not yet contain the new preference behavior.

- [ ] **Step 3: Implement the ContractCard star button**

In `components/ContractCard.tsx`:

1. Import `Star` from `lucide-react` and the saved-job helpers.
2. Change the props to `{ contract, wallet, onSavedChange }`.
3. Compute `saved = wallet ? isContractSaved(wallet, contract) : false`.
4. Add a `button type="button"` beside the status badge with `aria-label={saved ? "Remove saved job" : "Save job"}`, `aria-pressed={saved}`, and a filled yellow star when saved.
5. On click, if no wallet, return without writing; otherwise call save/unsave and invoke `onSavedChange` only when storage succeeds.
6. Keep the existing settlement `Link` as a separate interactive element.

- [ ] **Step 4: Implement Dashboard wallet resolution and filtering**

In `app/dashboard/page.tsx`:

1. Import `getCircleSession`, `isContractHidden`, and the wallet-scoped saved helper.
2. Add `wallet` state and resolve Circle first, then `arc-browser-wallet` JSON in the existing `useEffect`.
3. After merging public and local contracts, filter with `!isContractHidden(wallet, contract)` when a wallet exists.
4. Apply the same filter to the local fallback before setting contracts so stale data follows the same rule.
5. Pass `wallet` to every `ContractCard` and update the card state through a small saved toggle callback or by reloading the current list from storage.
6. Leave the dashboard unfiltered if no wallet is connected.

- [ ] **Step 5: Run focused UI tests and TypeScript checking**

Run: `npm run test:web -- web-test/marketplace-ui.test.ts`

Then run: `npx tsc --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit Dashboard and card changes**

```bash
git add app/dashboard/page.tsx components/ContractCard.tsx web-test/marketplace-ui.test.ts
git commit -m "feat: add dashboard visibility and saved job controls"
```

### Task 3: Add Archived Jobs and Saved Jobs to My Page

**Files:**
- Modify: `app/profile/page.tsx`
- Test: `web-test/marketplace-ui.test.ts`

**Interfaces:**
- My Page keeps one `allContracts` source list and derives `visibleContracts`, `archivedContracts`, and `savedContracts` from `wallet`.
- Existing applicant loading continues to use visible advertiser-owned contracts for active application review.

- [ ] **Step 1: Add failing My Page assertions**

Add assertions:

```ts
test("my page exposes archived restore and saved job sections", () => {
  assert.match(profileSource, /Archived Jobs/);
  assert.match(profileSource, /Restore/);
  assert.match(profileSource, /Saved Jobs/);
  assert.match(profileSource, /getHiddenContractsForWallet/);
  assert.match(profileSource, /restoreContractForWallet/);
  assert.match(profileSource, /getSavedContractsForWallet/);
  assert.match(profileSource, /unsaveContractForWallet/);
});
```

- [ ] **Step 2: Run the focused UI test and verify the expected failure**

Run: `npm run test:web -- web-test/marketplace-ui.test.ts`

Expected: FAIL because the new My Page sections and helpers are absent.

- [ ] **Step 3: Maintain an unfiltered contract source in ProfilePage**

In `app/profile/page.tsx`:

1. Import `getHiddenContractsForWallet`, `getSavedContractsForWallet`, and `restoreContractForWallet`.
2. Rename the `contracts` state to `allContracts` or add a separate state while preserving the existing `contracts` references through derived variables.
3. Store the unfiltered locally recovered contracts and the unfiltered merged public contracts.
4. Derive `visibleContracts = allContracts.filter(contract => !isContractHidden(wallet, contract))`.
5. Derive `archivedContracts = getHiddenContractsForWallet(wallet, allContracts)` and `savedContracts = getSavedContractsForWallet(wallet, allContracts)` with `useMemo` dependencies on `allContracts` and `wallet`.
6. Use `visibleContracts` for active created and assigned job sections and for received-application loading.

- [ ] **Step 4: Add restore behavior and Archived Jobs UI**

1. Add `restoreContract(contract)` that calls `restoreContractForWallet(wallet, contract)` and then refreshes `allContracts` state from its current value so derived lists update.
2. Render an `Archived Jobs` section after `Created Jobs`.
3. Render each archived job with its title, status, amount, link to the contract, and a `Restore` button.
4. Render an empty state when no jobs are archived.

- [ ] **Step 5: Add Saved Jobs UI**

1. Render a `Saved Jobs` section with each saved job's title, status, amount, a settlement link, and `Remove` button.
2. The `Remove` handler calls `unsaveContractForWallet(wallet, contract)` and refreshes `allContracts` state to force the derived saved list to update.
3. Keep saved jobs independent from the archived list so a hidden and saved job appears in both sections.
4. Update `Created jobs` count to use active created jobs only.

- [ ] **Step 6: Run focused UI tests and TypeScript checking**

Run: `npm run test:web -- web-test/marketplace-ui.test.ts`

Then run: `npx tsc --noEmit`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit My Page changes**

```bash
git add app/profile/page.tsx web-test/marketplace-ui.test.ts
git commit -m "feat: add archived and saved jobs to my page"
```

### Task 4: Full verification and browser smoke test

**Files:**
- Modify: none unless verification reveals a defect
- Test: all existing `web-test/**/*.test.ts` and `web-test/**/*.test.tsx`

- [ ] **Step 1: Run all web tests**

Run: `npm run test:web`

Expected: all web tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 3: Verify the browser flow**

With a connected advertiser wallet:

1. Open My Page and hide a deployed job.
2. Confirm it disappears from active Created Jobs and Dashboard.
3. Confirm it appears under Archived Jobs.
4. Restore it and confirm it returns to active lists.
5. Open Dashboard, click a job star, and confirm the icon changes.
6. Open My Page and confirm the job appears under Saved Jobs.
7. Remove it from Saved Jobs and confirm it disappears.
8. Disconnect the wallet and confirm no saved state is written for the anonymous dashboard.

- [ ] **Step 4: Inspect the final diff and working tree**

Run: `git diff --check; git status --short; git log -3 --oneline`

Expected: no whitespace errors and only intentional committed changes remain.
