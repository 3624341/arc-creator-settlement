<<<<<<< HEAD
# Arc Creator Settlement v0.3 Onchain Receipts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a polished receipt for every confirmed Arc milestone release and make that receipt usable as verifiable evidence in the owner's Arc Discord/community application.

**Architecture:** A server-side Arc RPC loader treats the `PaymentReleased` event and escrow state as the source of truth. Public receipt pages use the transaction hash as their identifier; wallet flows capture the confirmed hash, while an optional server-only Supabase index supports recent-receipt discovery without becoming a verification dependency.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, viem 2, Tailwind CSS 3, Node test runner through `tsx`, Hardhat 2, Supabase JS 2.

**Spec:** `docs/superpowers/specs/2026-09-01-onchain-receipts-design.md`

## Global Constraints

- Arc Testnet chain ID remains `5042002` unless an existing environment variable overrides it.
- Existing `MilestoneEscrow` and `EscrowFactory` bytecode must not change or require redeployment.
- Receipt payment facts must come from or be checked against Arc RPC data.
- Receipt rendering must work when Supabase is absent or unavailable.
- Supabase writes require a server-only secret and an onchain verification pass.
- Never expose Circle secrets, Supabase secret/service-role keys, private keys, or recovery files through `NEXT_PUBLIC_` variables.
- Do not fabricate transaction hashes, deployment state, users, volume, or settlement metrics.
- Use Next.js 15 asynchronous `params` conventions.
- Preserve the existing warm, rounded visual identity while improving hierarchy, responsive behavior, and verification clarity.

---

## File Structure

- `lib/receipts/types.ts` — receipt domain types and stable error codes.
- `lib/receipts/chain.ts` — pure log decoding plus an Arc RPC receipt loader.
- `lib/receipts/client.ts` — browser receipt history and bounded Circle-event tracking.
- `lib/receipts/store.ts` — optional server-only Supabase index.
- `components/ReceiptCard.tsx` — server-renderable receipt presentation.
- `components/CopyReceiptButton.tsx` — isolated clipboard interaction.
- `components/RecentReceipts.tsx` — client-side recent-receipt discovery and list UI.
- `app/receipt/[txHash]/page.tsx` — public receipt route.
- `app/api/receipts/route.ts` — verified indexing and recent-index API.
- `web-test/*.test.ts(x)` — fast receipt-domain and rendering tests.

---

### Task 1: Receipt Domain and Arc Verification Loader

**Files:**
- Modify: `package.json`
- Modify: `lib/abi.ts`
- Create: `lib/receipts/types.ts`
- Create: `lib/receipts/chain.ts`
- Create: `web-test/receipt-chain.test.ts`

**Interfaces:**
- Produces: `SettlementReceipt`, `ReceiptError`, `decodePaymentReleasedLog(log)`, `loadSettlementReceipt(txHash, source?)`.
- Consumes: existing `escrowAbi`, Arc RPC configuration, `formatUsdc`, and `txUrl`.

- [ ] **Step 1: Add a web-test script and the failing hash-validation test**

Add `"test:web": "tsx --test web-test/**/*.test.ts web-test/**/*.test.tsx"` to `package.json`, then create:

```ts
// web-test/receipt-chain.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { loadSettlementReceipt } from "../lib/receipts/chain";

test("rejects a malformed transaction hash before RPC access", async () => {
  let called = false;
  await assert.rejects(
    loadSettlementReceipt("not-a-hash", {
      getTransactionReceipt: async () => { called = true; throw new Error("unexpected"); }
    } as never),
    (error: unknown) => error instanceof Error && error.message === "INVALID_TRANSACTION_HASH"
  );
  assert.equal(called, false);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:web -- --test-name-pattern="malformed transaction hash"`

Expected: FAIL because `lib/receipts/chain.ts` does not exist.

- [ ] **Step 3: Add the minimal domain types and hash guard**

Define `SettlementReceipt` with the exact fields from the spec and a `ReceiptErrorCode` union containing `INVALID_TRANSACTION_HASH`, `TRANSACTION_NOT_FOUND`, `TRANSACTION_REVERTED`, `PAYMENT_EVENT_NOT_FOUND`, `PAYMENT_EVENT_AMBIGUOUS`, `CONTRACT_STATE_MISMATCH`, and `RPC_UNAVAILABLE`. Implement a `ReceiptError` whose message equals its code. Add the `0x` + 64-hex-character guard at the start of `loadSettlementReceipt`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="malformed transaction hash"`

Expected: PASS with no RPC call.

- [ ] **Step 5: Add a failing `PaymentReleased` decoding test**

Append a test that builds topics with viem's `encodeEventTopics` and the amount data with `encodeAbiParameters`, then asserts:

```ts
assert.deepEqual(decoded, {
  escrowAddress: "0x1000000000000000000000000000000000000000",
  txHash: `0x${"a".repeat(64)}`,
  milestoneIndex: 2n,
  creatorAddress: "0x2000000000000000000000000000000000000000",
  amount: 425_000_000n
});
```

- [ ] **Step 6: Run the decoding test and verify RED**

Run: `npm run test:web -- --test-name-pattern="decodes PaymentReleased"`

Expected: FAIL because the event is missing from `escrowAbi` and no decoder exists.

- [ ] **Step 7: Add the ABI event and minimal decoder**

Add the exact Solidity event to `escrowAbi`:

```ts
{
  type: "event",
  name: "PaymentReleased",
  inputs: [
    { indexed: true, name: "milestoneId", type: "uint256" },
    { indexed: true, name: "creator", type: "address" },
    { indexed: false, name: "amount", type: "uint256" }
  ],
  anonymous: false
}
```

Implement `decodePaymentReleasedLog` with viem `decodeEventLog`, returning `null` for non-matching logs.

- [ ] **Step 8: Run the decoder tests and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="PaymentReleased"`

Expected: PASS.

- [ ] **Step 9: Add failing loader tests for success and rejection paths**

Use an injected `ReceiptDataSource` whose methods return plain transaction, block, and contract-read values. Cover successful normalization, a reverted receipt, no payment event, two payment events, a creator mismatch, and an unreleased milestone. Assert a successful receipt has `amountUsdc: "425"`, `confirmedAt: "2026-09-01T00:00:00.000Z"`, and the exact ArcScan URL.

- [ ] **Step 10: Run the loader tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="receipt loader"`

Expected: FAIL because full verification is not implemented.

- [ ] **Step 11: Implement the minimal verified loader**

Create a viem public-client adapter and implement the eight verification steps from the spec. Read `client`, `creator`, `title`, and `getMilestone` in parallel at `blockNumber`. Convert bigint and `Date` values to strings before returning the plain `SettlementReceipt` object.

- [ ] **Step 12: Run all Task 1 tests and commit**

Run: `npm run test:web`

Expected: all receipt-chain tests PASS.

```bash
git add package.json lib/abi.ts lib/receipts web-test/receipt-chain.test.ts
git commit -m "feat: verify Arc settlement receipts"
```

---

### Task 2: Public Receipt Page and Presentation

**Files:**
- Create: `components/CopyReceiptButton.tsx`
- Create: `components/ReceiptCard.tsx`
- Create: `app/receipt/[txHash]/page.tsx`
- Create: `app/receipt/[txHash]/loading.tsx`
- Create: `web-test/receipt-card.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `SettlementReceipt`, `ReceiptError`, and `loadSettlementReceipt` from Task 1.
- Produces: public `/receipt/<txHash>` HTML and reusable `ReceiptCard({ receipt })`.

- [ ] **Step 1: Write a failing server-render test for the receipt card**

Use `renderToStaticMarkup` and assert the HTML contains `Confirmed on Arc`, `425 USDC`, the project and milestone names, shortened client/creator addresses, chain ID `5042002`, and the exact ArcScan URL.

- [ ] **Step 2: Run the card test and verify RED**

Run: `npm run test:web -- --test-name-pattern="renders a confirmed receipt"`

Expected: FAIL because `ReceiptCard` does not exist.

- [ ] **Step 3: Implement the minimal receipt card and copy control**

Build a semantic `<article>` containing a confirmation seal, amount hero, project/milestone context, definition lists for addresses and chain metadata, full transaction hash, and primary/secondary actions. Keep clipboard code in a small `'use client'` button receiving only `value` and `label` strings.

- [ ] **Step 4: Run the card test and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="renders a confirmed receipt"`

Expected: PASS.

- [ ] **Step 5: Write failing error-state mapping tests**

Export a pure `receiptErrorView(code)` helper from the page support module and assert distinct headings for invalid hash, unrelated transaction, reverted transaction, contract mismatch, and RPC unavailable.

- [ ] **Step 6: Run the mapping tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="receipt error"`

Expected: FAIL because the error mapping does not exist.

- [ ] **Step 7: Implement the Next.js 15 receipt route**

Use this signature:

```ts
type ReceiptPageProps = { params: Promise<{ txHash: string }> };

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { txHash } = await params;
  // load, render ReceiptCard, or render the mapped non-sensitive error state
}
```

Add dynamic metadata derived from the verified project title when loading succeeds and safe generic metadata when it fails. Add a loading skeleton that mirrors the final card dimensions.

- [ ] **Step 8: Finish responsive receipt styling and commit**

Use existing Arc colors, a compact verification grid at desktop, a single-column layout at 375 px, visible keyboard focus, `overflow-wrap` for hashes, and no horizontal scrolling.

Run: `npm run test:web`

Expected: all tests PASS.

```bash
git add app/receipt components/CopyReceiptButton.tsx components/ReceiptCard.tsx app/globals.css web-test/receipt-card.test.tsx
git commit -m "feat: add public onchain receipt page"
```

---

### Task 3: Confirmed Release Tracking and Local Receipt History

**Files:**
- Create: `lib/receipts/client.ts`
- Create: `web-test/receipt-client.test.ts`
- Modify: `app/contracts/[id]/page.tsx`

**Interfaces:**
- Produces: `saveRecentReceipt(hash)`, `getRecentReceiptHashes()`, `findCircleReleaseTransaction(input)`, and confirmed `View receipt` links.
- Consumes: `PaymentReleased` ABI event and existing wallet clients.

- [ ] **Step 1: Write failing history tests**

Inject a minimal `Storage`-like object and test newest-first ordering, case-insensitive de-duplication, invalid-hash rejection, and a maximum of 20 entries.

- [ ] **Step 2: Run history tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="recent receipt history"`

Expected: FAIL because client receipt history does not exist.

- [ ] **Step 3: Implement minimal receipt history**

Store JSON under `arc-settlement-receipts-v1`. Treat malformed stored JSON as an empty history. Export browser convenience wrappers and storage-injected pure helpers for tests.

- [ ] **Step 4: Run history tests and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="recent receipt history"`

Expected: PASS.

- [ ] **Step 5: Write failing Circle log-selection tests**

Provide logs from the wrong escrow, wrong milestone, wrong creator, and one exact match. Assert only the exact match returns its transaction hash. Add a timeout test using an injected sleep function and block-log loader.

- [ ] **Step 6: Run Circle tracking tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="Circle release"`

Expected: FAIL because event tracking does not exist.

- [ ] **Step 7: Implement bounded Circle release tracking**

Poll at most 12 times, every two seconds in production, from the recorded pre-release block through `latest`. Filter by escrow address, decoded milestone index, and creator. Return the transaction hash or `undefined`; never claim the Circle-approved transaction failed solely because indexing timed out.

- [ ] **Step 8: Integrate browser-wallet confirmation**

For `approveAndRelease`, call `waitForTransactionReceipt({ hash })`, require `status === "success"`, save the hash, request optional indexing without blocking success, then mark the milestone paid and expose `/receipt/<hash>`.

- [ ] **Step 9: Integrate Circle confirmation**

Record the current block before `circleExec`, wait for the matching release event after Circle approval, and apply the same history/index/view-receipt flow. Keep a per-milestone pending state to prevent duplicate clicks.

- [ ] **Step 10: Run tests and commit**

Run: `npm run test:web && npm run test`

Expected: web tests and existing Hardhat tests PASS.

```bash
git add lib/receipts/client.ts app/contracts/[id]/page.tsx web-test/receipt-client.test.ts
git commit -m "feat: surface receipts after milestone release"
```

---

### Task 4: Optional Verified Supabase Index

**Files:**
- Modify: `supabase/schema.sql`
- Create: `.env.example`
- Create: `lib/receipts/store.ts`
- Create: `app/api/receipts/route.ts`
- Create: `web-test/receipt-store.test.ts`

**Interfaces:**
- Produces: `indexReceipt(txHash)`, `listRecentReceipts(limit)`, `GET /api/receipts`, and `POST /api/receipts`.
- Consumes: `loadSettlementReceipt` and server-only Supabase configuration.

- [ ] **Step 1: Verify current Supabase guidance before code**

Fetch `https://supabase.com/changelog.md`, scan relevant breaking changes, then fetch the current RLS and server-side JavaScript client documentation. Confirm the secret-key environment naming and `upsert` behavior against current docs before implementing.

- [ ] **Step 2: Write failing disabled-store tests**

Assert that missing Supabase configuration makes `indexReceipt` return `{ enabled: false, indexed: false }` and `listRecentReceipts` return `[]` without throwing.

- [ ] **Step 3: Run store tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="receipt store"`

Expected: FAIL because the store does not exist.

- [ ] **Step 4: Implement optional server-only store configuration**

Read `SUPABASE_URL` plus `SUPABASE_SECRET_KEY`, with `SUPABASE_SERVICE_ROLE_KEY` accepted only as a legacy server-side fallback. Never read a `NEXT_PUBLIC_` secret. Allow an injected store client in tests.

- [ ] **Step 5: Add failing verified-upsert tests**

Inject a loader returning a known `SettlementReceipt` and a fake upsert client. Assert the stored payload comes exclusively from the loader, not from request body metadata. Assert loader errors prevent any upsert.

- [ ] **Step 6: Run verified-upsert tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="verified receipt upsert"`

Expected: FAIL because verified upsert is incomplete.

- [ ] **Step 7: Implement the store and thin API route**

`POST` accepts only `{ txHash }`, calls the verified loader, then upserts. `GET` accepts a clamped `limit` from 1 to 20. Return `202` with `{ enabled: false }` when indexing is disabled, `201` when indexed, `400` for invalid hashes, `422` for non-receipt transactions, and `503` for RPC/store outages.

- [ ] **Step 8: Add the RLS-safe schema**

Append `public.settlement_receipts` with `tx_hash text primary key`, normalized receipt columns, `confirmed_at timestamptz`, and `created_at timestamptz default now()`. Enable RLS; grant `SELECT` to `anon` and `authenticated`; create one public-read policy; explicitly revoke `INSERT`, `UPDATE`, and `DELETE` from both roles. Do not add a public write policy.

- [ ] **Step 9: Document environment variables**

Create `.env.example` with existing Arc/Circle names plus optional `SUPABASE_URL` and `SUPABASE_SECRET_KEY` placeholders. Clearly label server-only values and do not include real credentials.

- [ ] **Step 10: Run tests and commit**

Run: `npm run test:web`

Expected: all store and route-support tests PASS.

```bash
git add supabase/schema.sql .env.example lib/receipts/store.ts app/api/receipts/route.ts web-test/receipt-store.test.ts
git commit -m "feat: index verified receipts in Supabase"
```

---

### Task 5: Recent Receipts and v0.3 Interface Polish

**Files:**
- Create: `components/RecentReceipts.tsx`
- Create: `components/NetworkStatus.tsx`
- Create: `web-test/recent-receipts.test.ts`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/page.tsx`
- Modify: `components/Shell.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: recent-receipt discovery, responsive shared navigation, network trust strip, and v0.3 metadata.
- Consumes: local receipt hashes and optional `GET /api/receipts` rows.

- [ ] **Step 1: Write failing merge tests**

Test `mergeRecentReceipts(localHashes, indexedReceipts)` for case-insensitive de-duplication, local-first fallback, confirmed-at descending order when metadata exists, and a 20-row cap.

- [ ] **Step 2: Run merge tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="merges recent receipts"`

Expected: FAIL because the merge helper does not exist.

- [ ] **Step 3: Implement recent receipt discovery**

Load local history immediately, fetch `/api/receipts?limit=20`, merge without treating fetch failure as fatal, and render amount/project/time when indexed metadata exists. Hash-only local rows still link to the chain-backed receipt page.

- [ ] **Step 4: Run merge tests and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="merges recent receipts"`

Expected: PASS.

- [ ] **Step 5: Add the dashboard receipt section**

Place `Recent receipts` after settlement cards. Show a concise empty state with a link to create or release a milestone. Do not display invented totals.

- [ ] **Step 6: Polish the shared product shell**

Add a `Receipts` anchor to the dashboard section, use a CSS/semantic mobile navigation that remains keyboard accessible, add strong `:focus-visible` styles, and prevent navigation overflow below 768 px.

- [ ] **Step 7: Strengthen the landing-page proof story**

Keep the existing hero but replace grant-internal wording with a public v0.3 message. Add a compact Arc Testnet status/chain-ID strip and a three-step `Create → Release → Verify` section. Keep the hero's single primary creation action and one dashboard secondary action.

- [ ] **Step 8: Update metadata and commit**

Set metadata title to `Arc Creator Settlement — Verifiable USDC milestone payments` and description to mention public onchain receipts on Arc.

Run: `npm run test:web`

Expected: all web tests PASS.

```bash
git add components/RecentReceipts.tsx components/NetworkStatus.tsx app/dashboard/page.tsx app/page.tsx components/Shell.tsx app/globals.css app/layout.tsx web-test/recent-receipts.test.ts
git commit -m "feat: polish v0.3 receipt experience"
```

---

### Task 6: Documentation, Full Verification, and Application Evidence

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `SETUP_NEXT_STEPS_KR.md`
- Modify: `docs/submission-checklist.md`
- Create: `docs/discord-application-evidence.md`

**Interfaces:**
- Produces: v0.3 setup instructions and a truthful evidence checklist for the Arc Discord/community application.

- [ ] **Step 1: Update version and documentation**

Set package version to `0.3.0`. Document `/receipt/<txHash>`, the chain-first trust model, optional Supabase configuration, exact local commands, and the fact that a real release transaction is required before claiming a live receipt.

- [ ] **Step 2: Add the Discord evidence template**

Create a short document with fields for deployed v0.3 URL, one public receipt URL, matching ArcScan transaction, public GitHub repository, builder/product-owner positioning, and a two-sentence Korean/English project summary. Leave evidence values visibly marked `미배포` rather than inventing them.

- [ ] **Step 3: Run contract and web tests**

Run: `npm run test && npm run test:web`

Expected: all Hardhat and web tests PASS with no unhandled rejection or warning caused by the new code.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: Next.js build succeeds; `/receipt/[txHash]` and `/api/receipts` are listed without TypeScript errors.

- [ ] **Step 5: Start the dev server and verify in browser**

Run: `npm run dev`.

Verify at 1280 px and 375 px:

- home page loads with no horizontal overflow
- dashboard recent-receipt empty/fallback state is usable
- malformed receipt hash shows the correct safe error state
- a known non-payment Arc transaction is not rendered as a settlement receipt
- header navigation remains usable
- console contains no blocking errors

- [ ] **Step 6: Review Supabase and client-secret boundaries**

Run:

```bash
rg -n "SUPABASE_(SECRET|SERVICE_ROLE)|CIRCLE_API_KEY|CIRCLE_ENTITY_SECRET" app components lib
rg -n "NEXT_PUBLIC_.*(SECRET|SERVICE|API_KEY|PRIVATE)" .
```

Expected: secrets appear only in server modules or documentation placeholders; no server secret is referenced from client components or a `NEXT_PUBLIC_` name.

- [ ] **Step 7: Run final diff and repository checks**

Run:

```bash
git diff --check
git status --short
git log --oneline --decorate -10
```

Expected: no whitespace errors; only intentional documentation changes remain before the final commit.

- [ ] **Step 8: Commit documentation**

```bash
git add package.json README.md SETUP_NEXT_STEPS_KR.md docs/submission-checklist.md docs/discord-application-evidence.md
git commit -m "docs: prepare v0.3 Arc application evidence"
```

- [ ] **Step 9: Run the final verification suite again**

Run: `npm run test && npm run test:web && npm run build`

Expected: every command exits `0`. Record the exact test counts and build result for the final handoff.
=======
# Arc Creator Settlement v0.3 Onchain Receipts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a polished receipt for every confirmed Arc milestone release and make that receipt usable as verifiable evidence in the owner's Arc Discord/community application.

**Architecture:** A server-side Arc RPC loader treats the `PaymentReleased` event and escrow state as the source of truth. Public receipt pages use the transaction hash as their identifier; wallet flows capture the confirmed hash, while an optional server-only Supabase index supports recent-receipt discovery without becoming a verification dependency.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, viem 2, Tailwind CSS 3, Node test runner through `tsx`, Hardhat 2, Supabase JS 2.

**Spec:** `docs/superpowers/specs/2026-09-01-onchain-receipts-design.md`

## Global Constraints

- Arc Testnet chain ID remains `5042002` unless an existing environment variable overrides it.
- Existing `MilestoneEscrow` and `EscrowFactory` bytecode must not change or require redeployment.
- Receipt payment facts must come from or be checked against Arc RPC data.
- Receipt rendering must work when Supabase is absent or unavailable.
- Supabase writes require a server-only secret and an onchain verification pass.
- Never expose Circle secrets, Supabase secret/service-role keys, private keys, or recovery files through `NEXT_PUBLIC_` variables.
- Do not fabricate transaction hashes, deployment state, users, volume, or settlement metrics.
- Use Next.js 15 asynchronous `params` conventions.
- Preserve the existing warm, rounded visual identity while improving hierarchy, responsive behavior, and verification clarity.

---

## File Structure

- `lib/receipts/types.ts` — receipt domain types and stable error codes.
- `lib/receipts/chain.ts` — pure log decoding plus an Arc RPC receipt loader.
- `lib/receipts/client.ts` — browser receipt history and bounded Circle-event tracking.
- `lib/receipts/store.ts` — optional server-only Supabase index.
- `components/ReceiptCard.tsx` — server-renderable receipt presentation.
- `components/CopyReceiptButton.tsx` — isolated clipboard interaction.
- `components/RecentReceipts.tsx` — client-side recent-receipt discovery and list UI.
- `app/receipt/[txHash]/page.tsx` — public receipt route.
- `app/api/receipts/route.ts` — verified indexing and recent-index API.
- `web-test/*.test.ts(x)` — fast receipt-domain and rendering tests.

---

### Task 1: Receipt Domain and Arc Verification Loader

**Files:**
- Modify: `package.json`
- Modify: `lib/abi.ts`
- Create: `lib/receipts/types.ts`
- Create: `lib/receipts/chain.ts`
- Create: `web-test/receipt-chain.test.ts`

**Interfaces:**
- Produces: `SettlementReceipt`, `ReceiptError`, `decodePaymentReleasedLog(log)`, `loadSettlementReceipt(txHash, source?)`.
- Consumes: existing `escrowAbi`, Arc RPC configuration, `formatUsdc`, and `txUrl`.

- [ ] **Step 1: Add a web-test script and the failing hash-validation test**

Add `"test:web": "tsx --test web-test/**/*.test.ts web-test/**/*.test.tsx"` to `package.json`, then create:

```ts
// web-test/receipt-chain.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { loadSettlementReceipt } from "../lib/receipts/chain";

test("rejects a malformed transaction hash before RPC access", async () => {
  let called = false;
  await assert.rejects(
    loadSettlementReceipt("not-a-hash", {
      getTransactionReceipt: async () => { called = true; throw new Error("unexpected"); }
    } as never),
    (error: unknown) => error instanceof Error && error.message === "INVALID_TRANSACTION_HASH"
  );
  assert.equal(called, false);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:web -- --test-name-pattern="malformed transaction hash"`

Expected: FAIL because `lib/receipts/chain.ts` does not exist.

- [ ] **Step 3: Add the minimal domain types and hash guard**

Define `SettlementReceipt` with the exact fields from the spec and a `ReceiptErrorCode` union containing `INVALID_TRANSACTION_HASH`, `TRANSACTION_NOT_FOUND`, `TRANSACTION_REVERTED`, `PAYMENT_EVENT_NOT_FOUND`, `PAYMENT_EVENT_AMBIGUOUS`, `CONTRACT_STATE_MISMATCH`, and `RPC_UNAVAILABLE`. Implement a `ReceiptError` whose message equals its code. Add the `0x` + 64-hex-character guard at the start of `loadSettlementReceipt`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="malformed transaction hash"`

Expected: PASS with no RPC call.

- [ ] **Step 5: Add a failing `PaymentReleased` decoding test**

Append a test that builds topics with viem's `encodeEventTopics` and the amount data with `encodeAbiParameters`, then asserts:

```ts
assert.deepEqual(decoded, {
  escrowAddress: "0x1000000000000000000000000000000000000000",
  txHash: `0x${"a".repeat(64)}`,
  milestoneIndex: 2n,
  creatorAddress: "0x2000000000000000000000000000000000000000",
  amount: 425_000_000n
});
```

- [ ] **Step 6: Run the decoding test and verify RED**

Run: `npm run test:web -- --test-name-pattern="decodes PaymentReleased"`

Expected: FAIL because the event is missing from `escrowAbi` and no decoder exists.

- [ ] **Step 7: Add the ABI event and minimal decoder**

Add the exact Solidity event to `escrowAbi`:

```ts
{
  type: "event",
  name: "PaymentReleased",
  inputs: [
    { indexed: true, name: "milestoneId", type: "uint256" },
    { indexed: true, name: "creator", type: "address" },
    { indexed: false, name: "amount", type: "uint256" }
  ],
  anonymous: false
}
```

Implement `decodePaymentReleasedLog` with viem `decodeEventLog`, returning `null` for non-matching logs.

- [ ] **Step 8: Run the decoder tests and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="PaymentReleased"`

Expected: PASS.

- [ ] **Step 9: Add failing loader tests for success and rejection paths**

Use an injected `ReceiptDataSource` whose methods return plain transaction, block, and contract-read values. Cover successful normalization, a reverted receipt, no payment event, two payment events, a creator mismatch, and an unreleased milestone. Assert a successful receipt has `amountUsdc: "425"`, `confirmedAt: "2026-09-01T00:00:00.000Z"`, and the exact ArcScan URL.

- [ ] **Step 10: Run the loader tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="receipt loader"`

Expected: FAIL because full verification is not implemented.

- [ ] **Step 11: Implement the minimal verified loader**

Create a viem public-client adapter and implement the eight verification steps from the spec. Read `client`, `creator`, `title`, and `getMilestone` in parallel at `blockNumber`. Convert bigint and `Date` values to strings before returning the plain `SettlementReceipt` object.

- [ ] **Step 12: Run all Task 1 tests and commit**

Run: `npm run test:web`

Expected: all receipt-chain tests PASS.

```bash
git add package.json lib/abi.ts lib/receipts web-test/receipt-chain.test.ts
git commit -m "feat: verify Arc settlement receipts"
```

---

### Task 2: Public Receipt Page and Presentation

**Files:**
- Create: `components/CopyReceiptButton.tsx`
- Create: `components/ReceiptCard.tsx`
- Create: `app/receipt/[txHash]/page.tsx`
- Create: `app/receipt/[txHash]/loading.tsx`
- Create: `web-test/receipt-card.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `SettlementReceipt`, `ReceiptError`, and `loadSettlementReceipt` from Task 1.
- Produces: public `/receipt/<txHash>` HTML and reusable `ReceiptCard({ receipt })`.

- [ ] **Step 1: Write a failing server-render test for the receipt card**

Use `renderToStaticMarkup` and assert the HTML contains `Confirmed on Arc`, `425 USDC`, the project and milestone names, shortened client/creator addresses, chain ID `5042002`, and the exact ArcScan URL.

- [ ] **Step 2: Run the card test and verify RED**

Run: `npm run test:web -- --test-name-pattern="renders a confirmed receipt"`

Expected: FAIL because `ReceiptCard` does not exist.

- [ ] **Step 3: Implement the minimal receipt card and copy control**

Build a semantic `<article>` containing a confirmation seal, amount hero, project/milestone context, definition lists for addresses and chain metadata, full transaction hash, and primary/secondary actions. Keep clipboard code in a small `'use client'` button receiving only `value` and `label` strings.

- [ ] **Step 4: Run the card test and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="renders a confirmed receipt"`

Expected: PASS.

- [ ] **Step 5: Write failing error-state mapping tests**

Export a pure `receiptErrorView(code)` helper from the page support module and assert distinct headings for invalid hash, unrelated transaction, reverted transaction, contract mismatch, and RPC unavailable.

- [ ] **Step 6: Run the mapping tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="receipt error"`

Expected: FAIL because the error mapping does not exist.

- [ ] **Step 7: Implement the Next.js 15 receipt route**

Use this signature:

```ts
type ReceiptPageProps = { params: Promise<{ txHash: string }> };

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { txHash } = await params;
  // load, render ReceiptCard, or render the mapped non-sensitive error state
}
```

Add dynamic metadata derived from the verified project title when loading succeeds and safe generic metadata when it fails. Add a loading skeleton that mirrors the final card dimensions.

- [ ] **Step 8: Finish responsive receipt styling and commit**

Use existing Arc colors, a compact verification grid at desktop, a single-column layout at 375 px, visible keyboard focus, `overflow-wrap` for hashes, and no horizontal scrolling.

Run: `npm run test:web`

Expected: all tests PASS.

```bash
git add app/receipt components/CopyReceiptButton.tsx components/ReceiptCard.tsx app/globals.css web-test/receipt-card.test.tsx
git commit -m "feat: add public onchain receipt page"
```

---

### Task 3: Confirmed Release Tracking and Local Receipt History

**Files:**
- Create: `lib/receipts/client.ts`
- Create: `web-test/receipt-client.test.ts`
- Modify: `app/contracts/[id]/page.tsx`

**Interfaces:**
- Produces: `saveRecentReceipt(hash)`, `getRecentReceiptHashes()`, `findCircleReleaseTransaction(input)`, and confirmed `View receipt` links.
- Consumes: `PaymentReleased` ABI event and existing wallet clients.

- [ ] **Step 1: Write failing history tests**

Inject a minimal `Storage`-like object and test newest-first ordering, case-insensitive de-duplication, invalid-hash rejection, and a maximum of 20 entries.

- [ ] **Step 2: Run history tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="recent receipt history"`

Expected: FAIL because client receipt history does not exist.

- [ ] **Step 3: Implement minimal receipt history**

Store JSON under `arc-settlement-receipts-v1`. Treat malformed stored JSON as an empty history. Export browser convenience wrappers and storage-injected pure helpers for tests.

- [ ] **Step 4: Run history tests and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="recent receipt history"`

Expected: PASS.

- [ ] **Step 5: Write failing Circle log-selection tests**

Provide logs from the wrong escrow, wrong milestone, wrong creator, and one exact match. Assert only the exact match returns its transaction hash. Add a timeout test using an injected sleep function and block-log loader.

- [ ] **Step 6: Run Circle tracking tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="Circle release"`

Expected: FAIL because event tracking does not exist.

- [ ] **Step 7: Implement bounded Circle release tracking**

Poll at most 12 times, every two seconds in production, from the recorded pre-release block through `latest`. Filter by escrow address, decoded milestone index, and creator. Return the transaction hash or `undefined`; never claim the Circle-approved transaction failed solely because indexing timed out.

- [ ] **Step 8: Integrate browser-wallet confirmation**

For `approveAndRelease`, call `waitForTransactionReceipt({ hash })`, require `status === "success"`, save the hash, request optional indexing without blocking success, then mark the milestone paid and expose `/receipt/<hash>`.

- [ ] **Step 9: Integrate Circle confirmation**

Record the current block before `circleExec`, wait for the matching release event after Circle approval, and apply the same history/index/view-receipt flow. Keep a per-milestone pending state to prevent duplicate clicks.

- [ ] **Step 10: Run tests and commit**

Run: `npm run test:web && npm run test`

Expected: web tests and existing Hardhat tests PASS.

```bash
git add lib/receipts/client.ts app/contracts/[id]/page.tsx web-test/receipt-client.test.ts
git commit -m "feat: surface receipts after milestone release"
```

---

### Task 4: Optional Verified Supabase Index

**Files:**
- Modify: `supabase/schema.sql`
- Create: `.env.example`
- Create: `lib/receipts/store.ts`
- Create: `app/api/receipts/route.ts`
- Create: `web-test/receipt-store.test.ts`

**Interfaces:**
- Produces: `indexReceipt(txHash)`, `listRecentReceipts(limit)`, `GET /api/receipts`, and `POST /api/receipts`.
- Consumes: `loadSettlementReceipt` and server-only Supabase configuration.

- [ ] **Step 1: Verify current Supabase guidance before code**

Fetch `https://supabase.com/changelog.md`, scan relevant breaking changes, then fetch the current RLS and server-side JavaScript client documentation. Confirm the secret-key environment naming and `upsert` behavior against current docs before implementing.

- [ ] **Step 2: Write failing disabled-store tests**

Assert that missing Supabase configuration makes `indexReceipt` return `{ enabled: false, indexed: false }` and `listRecentReceipts` return `[]` without throwing.

- [ ] **Step 3: Run store tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="receipt store"`

Expected: FAIL because the store does not exist.

- [ ] **Step 4: Implement optional server-only store configuration**

Read `SUPABASE_URL` plus `SUPABASE_SECRET_KEY`, with `SUPABASE_SERVICE_ROLE_KEY` accepted only as a legacy server-side fallback. Never read a `NEXT_PUBLIC_` secret. Allow an injected store client in tests.

- [ ] **Step 5: Add failing verified-upsert tests**

Inject a loader returning a known `SettlementReceipt` and a fake upsert client. Assert the stored payload comes exclusively from the loader, not from request body metadata. Assert loader errors prevent any upsert.

- [ ] **Step 6: Run verified-upsert tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="verified receipt upsert"`

Expected: FAIL because verified upsert is incomplete.

- [ ] **Step 7: Implement the store and thin API route**

`POST` accepts only `{ txHash }`, calls the verified loader, then upserts. `GET` accepts a clamped `limit` from 1 to 20. Return `202` with `{ enabled: false }` when indexing is disabled, `201` when indexed, `400` for invalid hashes, `422` for non-receipt transactions, and `503` for RPC/store outages.

- [ ] **Step 8: Add the RLS-safe schema**

Append `public.settlement_receipts` with `tx_hash text primary key`, normalized receipt columns, `confirmed_at timestamptz`, and `created_at timestamptz default now()`. Enable RLS; grant `SELECT` to `anon` and `authenticated`; create one public-read policy; explicitly revoke `INSERT`, `UPDATE`, and `DELETE` from both roles. Do not add a public write policy.

- [ ] **Step 9: Document environment variables**

Create `.env.example` with existing Arc/Circle names plus optional `SUPABASE_URL` and `SUPABASE_SECRET_KEY` placeholders. Clearly label server-only values and do not include real credentials.

- [ ] **Step 10: Run tests and commit**

Run: `npm run test:web`

Expected: all store and route-support tests PASS.

```bash
git add supabase/schema.sql .env.example lib/receipts/store.ts app/api/receipts/route.ts web-test/receipt-store.test.ts
git commit -m "feat: index verified receipts in Supabase"
```

---

### Task 5: Recent Receipts and v0.3 Interface Polish

**Files:**
- Create: `components/RecentReceipts.tsx`
- Create: `components/NetworkStatus.tsx`
- Create: `web-test/recent-receipts.test.ts`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/page.tsx`
- Modify: `components/Shell.tsx`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: recent-receipt discovery, responsive shared navigation, network trust strip, and v0.3 metadata.
- Consumes: local receipt hashes and optional `GET /api/receipts` rows.

- [ ] **Step 1: Write failing merge tests**

Test `mergeRecentReceipts(localHashes, indexedReceipts)` for case-insensitive de-duplication, local-first fallback, confirmed-at descending order when metadata exists, and a 20-row cap.

- [ ] **Step 2: Run merge tests and verify RED**

Run: `npm run test:web -- --test-name-pattern="merges recent receipts"`

Expected: FAIL because the merge helper does not exist.

- [ ] **Step 3: Implement recent receipt discovery**

Load local history immediately, fetch `/api/receipts?limit=20`, merge without treating fetch failure as fatal, and render amount/project/time when indexed metadata exists. Hash-only local rows still link to the chain-backed receipt page.

- [ ] **Step 4: Run merge tests and verify GREEN**

Run: `npm run test:web -- --test-name-pattern="merges recent receipts"`

Expected: PASS.

- [ ] **Step 5: Add the dashboard receipt section**

Place `Recent receipts` after settlement cards. Show a concise empty state with a link to create or release a milestone. Do not display invented totals.

- [ ] **Step 6: Polish the shared product shell**

Add a `Receipts` anchor to the dashboard section, use a CSS/semantic mobile navigation that remains keyboard accessible, add strong `:focus-visible` styles, and prevent navigation overflow below 768 px.

- [ ] **Step 7: Strengthen the landing-page proof story**

Keep the existing hero but replace grant-internal wording with a public v0.3 message. Add a compact Arc Testnet status/chain-ID strip and a three-step `Create → Release → Verify` section. Keep the hero's single primary creation action and one dashboard secondary action.

- [ ] **Step 8: Update metadata and commit**

Set metadata title to `Arc Creator Settlement — Verifiable USDC milestone payments` and description to mention public onchain receipts on Arc.

Run: `npm run test:web`

Expected: all web tests PASS.

```bash
git add components/RecentReceipts.tsx components/NetworkStatus.tsx app/dashboard/page.tsx app/page.tsx components/Shell.tsx app/globals.css app/layout.tsx web-test/recent-receipts.test.ts
git commit -m "feat: polish v0.3 receipt experience"
```

---

### Task 6: Documentation, Full Verification, and Application Evidence

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `SETUP_NEXT_STEPS_KR.md`
- Modify: `docs/submission-checklist.md`
- Create: `docs/discord-application-evidence.md`

**Interfaces:**
- Produces: v0.3 setup instructions and a truthful evidence checklist for the Arc Discord/community application.

- [ ] **Step 1: Update version and documentation**

Set package version to `0.3.0`. Document `/receipt/<txHash>`, the chain-first trust model, optional Supabase configuration, exact local commands, and the fact that a real release transaction is required before claiming a live receipt.

- [ ] **Step 2: Add the Discord evidence template**

Create a short document with fields for deployed v0.3 URL, one public receipt URL, matching ArcScan transaction, public GitHub repository, builder/product-owner positioning, and a two-sentence Korean/English project summary. Leave evidence values visibly marked `미배포` rather than inventing them.

- [ ] **Step 3: Run contract and web tests**

Run: `npm run test && npm run test:web`

Expected: all Hardhat and web tests PASS with no unhandled rejection or warning caused by the new code.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: Next.js build succeeds; `/receipt/[txHash]` and `/api/receipts` are listed without TypeScript errors.

- [ ] **Step 5: Start the dev server and verify in browser**

Run: `npm run dev`.

Verify at 1280 px and 375 px:

- home page loads with no horizontal overflow
- dashboard recent-receipt empty/fallback state is usable
- malformed receipt hash shows the correct safe error state
- a known non-payment Arc transaction is not rendered as a settlement receipt
- header navigation remains usable
- console contains no blocking errors

- [ ] **Step 6: Review Supabase and client-secret boundaries**

Run:

```bash
rg -n "SUPABASE_(SECRET|SERVICE_ROLE)|CIRCLE_API_KEY|CIRCLE_ENTITY_SECRET" app components lib
rg -n "NEXT_PUBLIC_.*(SECRET|SERVICE|API_KEY|PRIVATE)" .
```

Expected: secrets appear only in server modules or documentation placeholders; no server secret is referenced from client components or a `NEXT_PUBLIC_` name.

- [ ] **Step 7: Run final diff and repository checks**

Run:

```bash
git diff --check
git status --short
git log --oneline --decorate -10
```

Expected: no whitespace errors; only intentional documentation changes remain before the final commit.

- [ ] **Step 8: Commit documentation**

```bash
git add package.json README.md SETUP_NEXT_STEPS_KR.md docs/submission-checklist.md docs/discord-application-evidence.md
git commit -m "docs: prepare v0.3 Arc application evidence"
```

- [ ] **Step 9: Run the final verification suite again**

Run: `npm run test && npm run test:web && npm run build`

Expected: every command exits `0`. Record the exact test counts and build result for the final handoff.
>>>>>>> fbddcdeff66ac6e112e18b8097cbd14cf2ee1a72
