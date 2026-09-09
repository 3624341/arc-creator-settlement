# Creator Selection Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let advertisers create unassigned escrows, review shared applications, select one applicant, and assign that wallet on Arc before funding.

**Architecture:** Deploy a compatible escrow/factory implementation whose creator starts as zero and can be assigned once by the client before funding. Keep existing deployed escrows readable and unchanged. Extend the Supabase-backed application flow with on-chain-verified selection state, then expose selection and role-aware UI in My Page and contract detail.

**Tech Stack:** Solidity 0.8.24, Hardhat, Next.js 15 App Router, React 19, TypeScript, viem, Supabase REST via server-only service key, Arc Testnet.

**Spec:** `docs/superpowers/specs/2026-09-09-creator-selection-design.md`

## Global Constraints

- Existing deployed escrows retain their creator and payout behavior.
- New escrow funding is blocked until a nonzero creator is assigned.
- Only the escrow client can assign a creator, and only before funding or a prior assignment.
- Secret Supabase keys remain server-only and never use a `NEXT_PUBLIC_` prefix.
- Circle wallet flows continue through Circle contract execution; browser wallet flows use viem/OKX signing.
- Every new behavior gets a failing test before production code.

---

### Task 1: Make escrow creator assignment on-chain

**Files:**
- Modify: `contracts/MilestoneEscrow.sol`
- Modify: `contracts/EscrowFactory.sol`
- Test: `test/MilestoneEscrow.test.ts`

**Interfaces:**
- Produce `assignCreator(address newCreator)` and `CreatorAssigned(address indexed client, address indexed creator)`.
- Preserve `creator()`, `client()`, `deposit()`, `submitMilestone()`, and `approveAndRelease()` selectors.

- [ ] **Step 1: Write failing Hardhat tests**

Add tests that create an escrow with `ethers.ZeroAddress`, assert `deposit()` reverts with `CreatorNotAssigned`, allow only the client to assign a nonzero creator, emit `CreatorAssigned`, reject reassignment, and confirm the assigned creator can submit and receive a release. Keep the existing preassigned creator tests unchanged.

- [ ] **Step 2: Run the contract tests and verify the new tests fail**

Run `npm test -- --grep "assign|unassigned|preassigned"`.
Expected: the new tests fail because the constructor rejects zero creators and `assignCreator` does not exist.

- [ ] **Step 3: Implement the minimum contract change**

Change `creator` from immutable to storage, allow zero creator only in the constructor, add `CreatorNotAssigned`, `CreatorAlreadyAssigned`, `CreatorAssigned`, `assignCreator`, and require `creator != address(0)` in `deposit`. Keep the client-only guard and all existing milestone logic.

- [ ] **Step 4: Run Hardhat tests**

Run `npm test`.
Expected: all old and new tests pass.

- [ ] **Step 5: Update the factory constructor path**

Keep `createEscrow` ABI unchanged but allow the zero creator to pass through to the new escrow. Add a factory test or extend the fixture to verify a zero-creator escrow is emitted and readable.

- [ ] **Step 6: Compile and commit**

Run `npm run compile`, then commit `contracts/MilestoneEscrow.sol`, `contracts/EscrowFactory.sol`, tests, and generated artifacts if tracked with `git commit -m "feat: allow client creator assignment before funding"`.

### Task 2: Update ABI and create flow for optional creator

**Files:**
- Modify: `lib/abi.ts`
- Modify: `lib/contract-validation.ts`
- Modify: `app/contracts/create/page.tsx`
- Test: `web-test/contract-validation.test.ts`
- Test: `web-test/marketplace-ui.test.ts`

**Interfaces:**
- `validateContractDraft(title, creator, milestones)` accepts `creator === ""` and continues rejecting malformed nonempty values.
- `factoryAbi` adds the updated `EscrowCreated` event shape without changing function arguments.
- `escrowAbi` adds `assignCreator` and `CreatorAssigned` plus any read errors used by the UI.

- [ ] **Step 1: Write failing web tests**

Assert an empty creator draft is valid, a malformed nonempty creator is rejected, the create page labels the field optional, and an empty creator is encoded as `0x0000000000000000000000000000000000000000` in the create transaction source.

- [ ] **Step 2: Run the focused web tests and verify failure**

Run `npm run test:web -- web-test/contract-validation.test.ts web-test/marketplace-ui.test.ts`.
Expected: the empty creator validation and source assertions fail.

- [ ] **Step 3: Implement optional creator handling**

Remove the HTML `required` attribute, add helper copy explaining that the advertiser can select a creator after applications arrive, pass the zero address to Circle/browser factory calls when blank, and persist the zero address in local records. Display `Not assigned yet` instead of a raw zero address.

- [ ] **Step 4: Run focused web tests and build**

Run the focused web test command and `npm run build`.
Expected: both pass.

- [ ] **Step 5: Commit**

Commit with `git commit -m "feat: create escrows without a preassigned creator"`.

### Task 3: Add on-chain-verified application selection API

**Files:**
- Modify: `app/api/applications/route.ts`
- Modify: `lib/marketplace-remote.ts`
- Modify: `supabase/schema.sql`
- Test: `web-test/marketplace-ui.test.ts`

**Interfaces:**
- Add `PATCH /api/applications` with `{ contractId, applicant }` and response `{ application, enabled }`.
- The PATCH route verifies the escrow `client()` equals the advertiser wallet and `creator()` equals the applicant before setting the application to `Selected`.
- Reject missing applications, non-`Applied` applications, reassignment, invalid addresses, and unassigned/failed on-chain state.

- [ ] **Step 1: Write failing route/source tests**

Add source-level assertions for a PATCH handler, selected status, and on-chain creator/client verification. Add a schema assertion that the `Selected` status remains allowed and that service-role mutation is the only write path.

- [ ] **Step 2: Run tests and verify failure**

Run `npm run test:web -- web-test/marketplace-ui.test.ts`.
Expected: selection assertions fail because the route and client helper do not exist.

- [ ] **Step 3: Implement the route**

Create a server-only viem public client from `NEXT_PUBLIC_ARC_RPC_URL`, read `client`, `creator`, and `status` from the escrow, query Supabase for the target application and any existing `Selected` row, then update only the target row with the service client. Return clear 4xx errors for each invalid state.

- [ ] **Step 4: Add the remote helper**

Add `selectRemoteApplication(contractId, applicant)` using `PATCH`, `no-store`, and the existing disabled-without-Supabase response convention.

- [ ] **Step 5: Run focused tests and inspect security**

Run the focused web tests and manually inspect that no `SUPABASE_SECRET_KEY` is imported by client components. Confirm the SQL has RLS enabled and no anon insert/update/delete grants.

- [ ] **Step 6: Commit**

Commit with `git commit -m "feat: verify creator selection against escrow state"`.

### Task 4: Add advertiser selection UI and creator role states

**Files:**
- Create: `components/CreatorSelectionButton.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `app/contracts/[id]/page.tsx`
- Modify: `lib/marketplace-store.ts`
- Test: `web-test/profile.test.ts`
- Test: `web-test/marketplace-ui.test.ts`

**Interfaces:**
- `CreatorSelectionButton` accepts `{ contract: LocalContract; applicant: JobApplication; walletMode: "browser" | "circle"; advertiser: string; onSelected(): void }`.
- Browser selection sends `assignCreator(applicant)` and waits for receipt.
- Circle selection requests the same contract execution and polls `creator()` until it matches.

- [ ] **Step 1: Write failing UI tests**

Assert My Page includes a `Select creator` action for an Applied received application, the detail page shows `Not assigned yet` for zero creator, and an advertiser sees selection controls while an assigned creator sees only submit controls.

- [ ] **Step 2: Run focused tests and verify failure**

Run `npm run test:web -- web-test/profile.test.ts web-test/marketplace-ui.test.ts`.
Expected: new UI assertions fail.

- [ ] **Step 3: Implement browser and Circle selection**

Use `ensureArcNetwork`, `getWalletClient`, `escrowAbi.assignCreator`, and `waitForTransactionReceipt` for browser wallets. Use `requestCircleContractExecution` for Circle wallets and poll the public client. After on-chain confirmation, call `selectRemoteApplication` and update local state. Do not mark Selected when the chain transaction fails.

- [ ] **Step 4: Fix role detection and display**

Use the on-chain `client` address for advertiser ownership, not `creator`, when no local record exists. Treat zero creator as unassigned. Show `Apply as creator` only for a non-owner wallet while unassigned; show `Application status: Applied` or `Selected` when applicable; show `Creator assigned` for other wallets after selection; keep submit/release gating based on the on-chain roles.

- [ ] **Step 5: Add clear funding guard**

For the advertiser, disable or replace `Deposit to escrow` with `Select a creator before funding this escrow.` while creator is zero.

- [ ] **Step 6: Run focused tests and build**

Run the focused web tests and `npm run build`.
Expected: all pass with no TypeScript errors.

- [ ] **Step 7: Commit**

Commit with `git commit -m "feat: add advertiser creator selection flow"`.

### Task 5: Deploy and verify the new on-chain implementation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `SETUP_NEXT_STEPS_KR.md`
- Modify: Vercel Production environment variables outside the repository

- [ ] **Step 1: Compile and run the full test suite**

Run `npm test`, `npm run test:web`, and `npm run build`.

- [ ] **Step 2: Deploy the updated factory**

Use the existing Circle deployment path (`npm run circle:deploy`) or the approved Arc deployer path. Record the new factory address and deployment transaction. Do not overwrite the old factory address until the new contract is confirmed on ArcScan.

- [ ] **Step 3: Update environment configuration**

Set `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS` to the new factory address in Vercel Production, Preview, and Development. Keep Supabase variables server-only. Redeploy the `arc-creator-settlement-v0-2` project.

- [ ] **Step 4: Verify the end-to-end flow**

Use an advertiser wallet to create an escrow without a creator, verify “Not assigned yet,” use a different wallet to apply and sign, confirm the advertiser sees the application in My Page, select the applicant, confirm `assignCreator` on ArcScan, fund the escrow, submit as the selected creator, and release as the advertiser. Confirm a second applicant cannot be selected and old deployed escrows still load.

- [ ] **Step 5: Commit docs and deployment notes**

Document the new factory address, migration behavior, and required environment variables. Commit with `git commit -m "docs: document creator selection deployment"`.

