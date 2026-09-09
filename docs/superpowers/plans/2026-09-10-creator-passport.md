# Creator Passport and Applicant Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a wallet-signed Creator Passport, public profile APIs/pages, and advertiser-facing Applicant Cards without breaking legacy applications or Arc escrow selection.

**Architecture:** Keep the existing Next.js App Router and Supabase service-role API pattern. Put profile types/validation/signing in focused `lib` modules, expose read-only public profile routes and signed mutation routes, then compose profile data into existing profile and application flows. Treat confirmed `settlement_receipts` as the only source for Arc verification badges; all social metrics remain self-reported.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Supabase, viem, Node test runner via `tsx`, Hardhat.

**Spec:** The approved Luna High Creator Passport and advertiser Applicant Card work order in the task prompt.

## Global Constraints

- Wallet address is the profile identity and must be normalized to lowercase.
- Profile create/update requires a browser-wallet signature; Circle Wallet remains read-only for profile editing.
- Public reads return only `is_public=true` profiles and use `Cache-Control: no-store`.
- Confirmed `settlement_receipts` alone can activate Arc Settlement Verified.
- Social links and follower counts always display `Self-reported`.
- Legacy applications remain readable and applicants without profiles remain selectable.
- Do not expose private keys, Circle API keys, or Supabase service-role secrets to client bundles.
- Do not execute production Supabase SQL, alter Vercel settings, push, merge, or deploy.

### Task 1: Profile domain and signing primitives

**Files:**
- Create: `lib/creator-profile.ts`
- Create: `lib/creator-profile-signing.ts`
- Test: `web-test/creator-profile.test.ts`
- Test: `web-test/creator-profile-signing.test.ts`

- [ ] Write failing tests for wallet normalization, enum allowlists, field limits, HTTPS host validation, profile completeness, self-reported metadata, canonical payload hashing, and timestamp/version checks.
- [ ] Run the focused tests and verify they fail because the modules do not exist.
- [ ] Implement the smallest typed validators and signing helpers needed by the tests.
- [ ] Run focused tests, then refactor only while green.
- [ ] Commit `feat: add creator passport domain validation and signing`.

### Task 2: Supabase schema, migration, and receipt verification

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/migrations/20260909_creator_passport.sql`
- Modify: `lib/receipts/store.ts` or create `lib/creator-verification.ts`
- Test: `web-test/creator-verification.test.ts`

- [ ] Add failing tests for confirmed receipt aggregation, zero-safe values, and schema-visible profile version compatibility.
- [ ] Add idempotent `creator_profiles`, `job_applications.profile_version`, indexes, constraints, grants, and policies to the migration and canonical schema.
- [ ] Implement receipt aggregation with `0`/`0.00` fallbacks and no `NaN` output.
- [ ] Run focused tests and commit `feat: add creator passport persistence schema`.

### Task 3: Profile APIs and remote client

**Files:**
- Create: `app/api/profiles/route.ts`
- Create: `app/api/profiles/[wallet]/route.ts`
- Create: `lib/creator-profile-remote.ts`
- Modify: `lib/creator-profile-signing.ts`
- Test: `web-test/creator-profile-api.test.ts`

- [ ] Write failing route-level tests for invalid wallets, private/not-found reads, batch limits, signed PUT success, invalid signer/expiry/stale version, and safe 503 responses.
- [ ] Implement server-only Supabase access, public single/batch reads, payload validation, recovered-signer checks, five-minute issued-at window, optimistic profile versioning, and no-store headers.
- [ ] Add typed client fetch helpers without importing server secrets.
- [ ] Run focused API tests and commit `feat: add signed creator profile APIs`.

### Task 4: Creator Passport UI and public profile

**Files:**
- Create: `components/CreatorPassportSummary.tsx`
- Create: `components/CreatorProfileForm.tsx`
- Create: `components/CreatorProfileHeader.tsx`
- Create: `components/CreatorSocialLinks.tsx`
- Create: `components/CreatorPortfolio.tsx`
- Create: `components/CreatorVerificationBadges.tsx`
- Create: `app/profile/edit/page.tsx`
- Create: `app/creators/[wallet]/page.tsx`
- Modify: `app/profile/page.tsx`
- Test: `web-test/creator-passport-ui.test.ts`

- [ ] Add source-level/UI tests for empty state, summary badges, field labels, self-reported copy, private-profile empty state, mobile-safe classes, and browser-wallet-only edit guidance.
- [ ] Implement client validation, preview-before-sign, browser-wallet `personal_sign`, signed PUT, success/error states, public profile rendering, shortened/copyable wallet, and ArcScan links.
- [ ] Preserve all existing My Page sections and selection controls.
- [ ] Run focused tests and commit `feat: add creator passport pages`.

### Task 5: Application gating and Applicant Cards

**Files:**
- Create: `components/ApplicationProfilePreview.tsx`
- Create: `components/ApplicantCard.tsx`
- Modify: `app/api/applications/route.ts`
- Modify: `lib/marketplace-remote.ts`
- Modify: `app/contracts/[id]/page.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `supabase/schema.sql`
- Test: `web-test/applicant-card.test.ts`
- Test: `web-test/application-profile-gating.test.ts`

- [ ] Write failing tests for incomplete-profile rejection, profile-version application signatures, legacy application reads, fallback cards, batch loading, filters, and preserved `CreatorSelectionButton` integration.
- [ ] Add profile lookup/version fields to application reads and writes while retaining legacy nullable rows.
- [ ] Gate new applications on profile completeness, show a preview, sign the versioned message, and save only after successful signature/API validation.
- [ ] Replace the received-applications row with responsive Applicant Cards, newest/verified/available sorting, role/language filters, verification badges, update-since-application copy, and fallback cards.
- [ ] Run focused tests and commit `feat: connect creator passports to applications`.

### Task 6: Documentation and verification

**Files:**
- Modify: `README.md`
- Modify: `SETUP_NEXT_STEPS_KR.md`
- Test/verify: all existing and new tests, build, `git diff --check`

- [ ] Document migration execution, required environment variables, browser-wallet editing limitation, future roadmap, and manual QA checklist.
- [ ] Run `npm test`, `npm run test:web`, `npm run build`, and `git diff --check`; record unrelated baseline failures separately if they remain environment-specific.
- [ ] Commit `docs: document creator passport rollout and QA`.
