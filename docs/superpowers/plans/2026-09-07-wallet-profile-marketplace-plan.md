# Wallet Profile Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a wallet-linked `/profile` page where one wallet can inspect created jobs, applications, active work, and milestone/payment progress.

**Architecture:** Add a focused client-side marketplace storage adapter for contracts and applications, then compose a profile page from filtered wallet-owned records. Extend the contract detail page with a duplicate-safe apply action, while preserving onchain milestone state as authoritative.

**Tech Stack:** Next.js App Router, React client components, TypeScript, localStorage, Node test runner, tsx, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-07-wallet-profile-marketplace-design.md`

## Global Constraints

- The first version is client-side and uses the existing localStorage contract store.
- A wallet may act as both advertiser and creator.
- Never store private keys, seed phrases, or wallet signing data.
- Prevent duplicate applications and applications to the applicant's own contract.
- Keep onchain milestone state authoritative on contract detail pages.
- Run the full web test suite and production build before completion.

### Task 1: Marketplace storage adapter

**Files:**
- Create: `lib/marketplace-store.ts`
- Modify: `web-test/receipt-store.test.ts` or create `web-test/marketplace-store.test.ts`

**Interfaces:**
- Produces `JobApplication`, `ApplicationStatus`, `getApplications()`, `saveApplication()`, `getContractsForWallet()`, and `isWalletOwner()`.

- [ ] **Step 1: Write failing tests** for reading malformed storage as empty arrays, saving an application, preventing duplicate applications, and rejecting an owner application.
- [ ] **Step 2: Run `npm.cmd run test:web` and confirm the new assertions fail because the adapter does not exist.
- [ ] **Step 3: Implement `lib/marketplace-store.ts` with `arc-job-applications` storage, defensive JSON parsing, normalized lowercase wallet comparisons, and explicit error results for duplicates/owners.
- [ ] **Step 4: Run the focused marketplace tests and confirm they pass.
- [ ] **Step 5: Commit with `git commit -m "feat: add marketplace storage adapter"`.

### Task 2: Creator application action

**Files:**
- Modify: `app/contracts/[id]/page.tsx`
- Test: `web-test/public-demo.test.tsx` or `web-test/marketplace-ui.test.ts`

**Interfaces:**
- Consumes `getCircleSession()`, browser wallet state, and the Task 1 storage adapter.
- Produces an `Apply as creator` action that stores `{ id, contractId, applicant, status: "Applied", appliedAt }` and displays a non-duplicating applied state.

- [ ] **Step 1: Write failing source tests** for the apply label, `Applied` status, duplicate guard, owner guard, and wallet-required message.
- [ ] **Step 2: Run the focused test and confirm it fails before the action exists.
- [ ] **Step 3: Add the minimal client-side apply state and handler; use the connected browser/Circle address, disable the action in demo mode, and show inline status feedback.
- [ ] **Step 4: Verify the action does not render as available for the contract owner and does not create a second application.
- [ ] **Step 5: Commit with `git commit -m "feat: allow creators to apply to jobs"`.

### Task 3: Wallet profile page and navigation

**Files:**
- Create: `app/profile/page.tsx`
- Modify: `components/Shell.tsx`
- Test: `web-test/profile.test.ts`

**Interfaces:**
- Consumes the Task 1 adapter and the connected wallet address restored by `Shell`.
- Produces `/profile` with `Created Jobs`, `My Applications`, and `Active Work` sections, summary cards, empty states, and links to contract details.

- [ ] **Step 1: Write failing tests** for `/profile` labels, wallet connect prompt, created-job filtering, application filtering, and active-work filtering.
- [ ] **Step 2: Run the focused test and confirm it fails because the route and navigation entry are missing.
- [ ] **Step 3: Implement the profile page as a client component with normalized records, shortened wallet identity, summary counts, status pills, and links to `/contracts/[id]`.
- [ ] **Step 4: Add `My Page` to desktop and mobile navigation without changing existing active-route behavior.
- [ ] **Step 5: Run focused tests and confirm all empty and populated states pass.
- [ ] **Step 6: Commit with `git commit -m "feat: add wallet profile page"`.

### Task 4: Progress and verification polish

**Files:**
- Modify: `app/profile/page.tsx`
- Modify: `app/contracts/[id]/page.tsx`
- Test: `web-test/profile.test.ts`

**Interfaces:**
- Consumes existing contract milestone and receipt loaders.
- Produces active-work cards showing application status, milestone completion percentage, paid USDC, and links to verified receipts where available.

- [ ] **Step 1: Write failing tests** for `Selected`, `Completed`, milestone progress, and paid amount labels.
- [ ] **Step 2: Run the focused test and confirm progress fields are absent.
- [ ] **Step 3: Implement progress derivation from the existing local contract record and onchain-loaded detail data; label local application metadata separately from verified onchain facts.
- [ ] **Step 4: Run `npm.cmd run test:web` and `npm.cmd run build` with the required worker permissions.
- [ ] **Step 5: Review the profile flow manually: connect wallet, open My Page, inspect empty states, apply to a job, and reopen My Page.
- [ ] **Step 6: Commit with `git commit -m "feat: show marketplace progress on wallet profile"`.

## Final verification

- Run `npm.cmd run test:web`; expected result: all tests pass.
- Run `npm.cmd run build`; expected result: Next.js production build completes successfully.
- Confirm no private key or seed phrase is written to localStorage.
- Confirm existing dashboard, receipt, wallet, and contract flows remain accessible.
