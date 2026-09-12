# Public Contract Descriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let advertisers enter a 20–2,000 character public job description when creating an Arc escrow and make it visible on the dashboard and contract detail page across browsers.

**Architecture:** Keep Arc contracts as the source of truth for ownership, lifecycle, and money. Store only human-readable descriptions in a server-written Supabase `contract_metadata` table keyed by escrow address; clients fetch metadata through a validated Next.js route and merge it into chain-derived listings without replacing any onchain field.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, viem, Supabase Postgres, node:test/tsx, Hardhat.

**Spec:** `docs/superpowers/specs/2026-09-11-contract-descriptions-design.md`

## Global Constraints

- Do not change or redeploy the existing escrow contract or ABI.
- Description is required for new contracts and must contain 20–2,000 trimmed characters.
- Supabase secret/service-role keys remain server-only and must never use a `NEXT_PUBLIC_` prefix.
- Public metadata must never override chain-derived title, wallets, amount, balance, or status.
- Existing contracts without metadata remain visible and show a neutral no-description fallback.
- A metadata outage must not hide a valid Arc escrow or convert an onchain success into a failed escrow transaction.
- `contract_metadata` is public-read and service-role-write only, with RLS enabled and explicit grants.

---

### Task 1: Description validation and local contract compatibility

**Files:**
- Modify: `lib/contract-validation.ts`
- Modify: `lib/marketplace-store.ts`
- Modify: `web-test/contract-validation.test.ts`
- Modify: `web-test/marketplace-store.test.ts`

**Interfaces:**
- Produces: `validateContractDraft(title, description, creator, milestones): string | undefined`
- Produces: optional `LocalContract.description?: string` for old-record compatibility.

- [ ] **Step 1: Write failing validation and compatibility tests**

Add literal boundary cases for 19, 20, 2,000, and 2,001 trimmed characters. Add a local contract round-trip assertion proving a description survives merge while an old record without one remains valid.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm.cmd run test:web -- web-test/contract-validation.test.ts web-test/marketplace-store.test.ts`

Expected: FAIL because `validateContractDraft` does not accept/validate a job description and `LocalContract` lacks the field.

- [ ] **Step 3: Add the minimal type and validation behavior**

Update the function signature and return specific messages for too-short and too-long descriptions. Keep creator and milestone validation unchanged.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same focused command and require zero failures.

### Task 2: Secure metadata storage boundary and migration

**Files:**
- Create: `lib/marketplace-metadata.ts`
- Create: `app/api/contracts/metadata/route.ts`
- Create: `supabase/migrations/20260912_contract_metadata.sql`
- Modify: `supabase/schema.sql`
- Create: `web-test/contract-metadata.test.ts`

**Interfaces:**
- Produces: `ContractMetadata`, `normalizeContractMetadataRows`, `fetchContractMetadata`, and `saveContractMetadata`.
- Produces: `GET /api/contracts/metadata?escrowAddresses=...` returning `{ enabled, metadata }`.
- Produces: `POST /api/contracts/metadata` accepting `{ escrowAddress, advertiserWallet, description }`.

- [ ] **Step 1: Write failing metadata normalization and route tests**

Test lowercase address normalization, malformed row filtering, 100-address batch limits, invalid POST bodies, missing backend configuration, advertiser mismatch, and successful insert. Assert that caller-supplied title/status/amount fields cannot enter the metadata response.

- [ ] **Step 2: Run the metadata tests and verify RED**

Run: `npm.cmd run test:web -- web-test/contract-metadata.test.ts`

Expected: FAIL because the module and route do not exist.

- [ ] **Step 3: Implement metadata client helpers and server route**

Use a server-only Supabase client. GET selects only `escrow_address,advertiser_wallet,description,created_at,updated_at`. POST validates the payload, reads the Arc escrow `client` with viem, rejects a mismatch, and inserts once; an existing identical row is returned idempotently while conflicting content is rejected.

- [ ] **Step 4: Add the migration and schema representation**

Create `public.contract_metadata` with lowercase EVM address checks, a 20–2,000 character description check, timestamps, RLS, explicit public SELECT grants, service-role write grants, revoked client writes, and a public-read policy.

- [ ] **Step 5: Run metadata tests and verify GREEN**

Run the focused metadata test and require zero failures.

### Task 3: Create-form description flow

**Files:**
- Modify: `app/contracts/create/page.tsx`
- Create: `web-test/contract-description-ui.test.ts`

**Interfaces:**
- Consumes: validation and metadata APIs from Tasks 1–2.
- Produces: a required `Job description` textarea, draft persistence, local fallback, and post-confirmation metadata save.

- [ ] **Step 1: Write failing UI-source and draft behavior tests**

Assert that the form exposes an accessible description textarea, includes the value in `arc-create-contract-draft`, passes it into validation, stores it in `LocalContract`, and calls metadata persistence only after an escrow address is confirmed.

- [ ] **Step 2: Run the UI test and verify RED**

Run: `npm.cmd run test:web -- web-test/contract-description-ui.test.ts`

Expected: FAIL because the form lacks the description flow.

- [ ] **Step 3: Implement the minimal create flow**

Add state and a 2,000-character textarea below title. Keep the description in the draft/local record. After Arc confirmation, save metadata; if that request fails, keep escrow creation successful and present a non-blocking warning explaining that the local description remains available in this browser.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the description UI and validation tests and require zero failures.

### Task 4: Public dashboard and contract detail rendering

**Files:**
- Modify: `lib/marketplace-chain.ts`
- Modify: `app/dashboard/page.tsx`
- Modify: `components/ContractCard.tsx`
- Modify: `app/contracts/[id]/page.tsx`
- Modify: `web-test/marketplace-store.test.ts`
- Modify: `web-test/marketplace-ui.test.ts`
- Modify: `web-test/contract-description-ui.test.ts`

**Interfaces:**
- Consumes: `fetchContractMetadata(addresses)` and optional `LocalContract.description`.
- Produces: metadata enrichment that changes only `description`, a clamped card preview, and a full detail section with fallback copy.

- [ ] **Step 1: Write failing merge and rendering tests**

Assert that metadata enriches matching addresses case-insensitively, never overwrites chain fields, metadata failure preserves all listings, cards show a clamped preview, and detail pages show either the full description or the neutral fallback.

- [ ] **Step 2: Run focused marketplace tests and verify RED**

Run: `npm.cmd run test:web -- web-test/marketplace-store.test.ts web-test/marketplace-ui.test.ts web-test/contract-description-ui.test.ts`

Expected: FAIL because public metadata is not loaded or rendered.

- [ ] **Step 3: Implement dashboard enrichment and display**

Load Arc contracts first, then request metadata best-effort and merge only the description. Render a two-line description preview in each card without delaying or hiding the chain listing.

- [ ] **Step 4: Implement detail loading and display**

Show the local description immediately, refresh it from public metadata for deployed escrows, and render “About this opportunity” before creator applications. Use a neutral fallback for old contracts.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the same focused marketplace command and require zero failures.

### Task 5: Configuration, full verification, integration, and deployment

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-09-12-contract-descriptions.md`

**Interfaces:**
- Produces: operational instructions for the migration and server-only Supabase settings.

- [ ] **Step 1: Document migration and failure behavior**

Explain that the migration must be applied before Production, that public reads are RLS-controlled, that writes pass through advertiser verification on the server, and that metadata outages do not invalidate Arc escrows.

- [ ] **Step 2: Run all web and contract tests**

Run: `npm.cmd run test:web`

Run: `npm.cmd test`

Expected: all tests pass with zero failures.

- [ ] **Step 3: Run a production build**

Run: `npm.cmd run build`

Expected: exit code 0 and the metadata route plus create/dashboard/detail pages compile.

- [ ] **Step 4: Apply and verify the Supabase migration**

Apply `supabase/migrations/20260912_contract_metadata.sql` to the linked Production Supabase project using the available authenticated dashboard/CLI path. Verify table constraints, RLS, public SELECT, denied public writes, and service-role writes with real test queries.

- [ ] **Step 5: Verify the browser flow on Preview**

Create or use a non-financial test draft to verify textarea validation and draft recovery. Verify dashboard/detail fallback without signing; perform an actual escrow creation only with explicit wallet approval, and never claim an onchain creation without the user signature.

- [ ] **Step 6: Commit, integrate, push, and deploy**

Commit validated changes on `codex/contract-descriptions`, integrate them into `main` without disturbing unrelated files, push `origin/main`, wait for Vercel Production to become READY, and verify `https://www.creatorsettle.com/contracts/create` plus dashboard/detail rendering.

