# Public Contract Descriptions Design

## Goal

Allow advertisers to describe what kind of creator they are looking for and what work the job requires, and make that description visible to creators on the public dashboard and contract detail page across browsers.

## Current state

- The Arc escrow stores the public title, creator wallet, advertiser wallet, total amount, escrow status, and milestone descriptions.
- The free-form job description has no onchain field and therefore cannot be added to the existing escrow without changing or redeploying contracts.
- The browser currently keeps local marketplace records in `arc-settlement-contracts`; local-only data is not sufficient for a creator using another browser.
- Existing applications, profiles, receipts, funding, milestone release, hide/archive, and saved-job behavior must remain unchanged.

## Chosen approach

Add a small public metadata layer in Supabase keyed by the deployed escrow address. The chain remains the source of truth for financial and lifecycle state; Supabase stores only human-readable job context.

### Data model

Add `public.contract_metadata` with:

- `escrow_address` as the lowercase EVM address primary key
- `advertiser_wallet` as the lowercase onchain client address
- `description` as non-empty text with a 20–2,000 character limit
- `created_at` and `updated_at` timestamps

Enable RLS with public read access and service-role-only writes. The application server owns writes so the browser never receives the Supabase secret key. Existing rows are not required for old contracts; old contracts show a clear “description not provided” state.

The endpoint accepts metadata only when the supplied escrow address is a valid Arc escrow and its onchain `client` equals the supplied advertiser wallet. A metadata row is inserted once for a newly created escrow. The description is informational only and is never used as proof of funding, ownership, creator selection, or payment.

## User flow

### Create contract

1. Add a required “Job description” textarea below the title and above the optional creator wallet.
2. Persist the textarea in the existing create draft so refreshes do not lose it.
3. Validate 20–2,000 trimmed characters before any wallet transaction.
4. Keep the existing onchain `createEscrow` call unchanged.
5. After the escrow address is confirmed, persist the description with the escrow address and advertiser wallet through the server endpoint.
6. If metadata persistence is temporarily unavailable, keep the onchain creation successful, retain the description in the local record, and show a non-blocking warning with retry guidance.

### Public dashboard

1. Load public escrow records from Arc exactly as today.
2. Fetch metadata in a separate best-effort request keyed by escrow addresses.
3. Merge matching descriptions into `LocalContract` records without replacing chain-derived title, wallets, total, or status.
4. Show a clamped description preview on each dashboard card.
5. A metadata API failure must not remove or hide a valid onchain contract.

### Contract detail

1. Load the description from the local record immediately when available.
2. Fetch public metadata by escrow address for records opened from another browser.
3. Display a labeled “About this opportunity” section before the creator application area, with the full description and guidance that it describes the requested creator profile and work scope.
4. If no description exists, show a neutral “The advertiser has not added a public description yet” message.

## API boundary

Create `app/api/contracts/metadata/route.ts`:

- `GET /api/contracts/metadata?escrowAddresses=0x...,0x...` returns `{ enabled, metadata }` and uses no-store caching.
- `POST /api/contracts/metadata` validates the payload, checks the Arc escrow’s onchain `client`, and inserts or returns the existing row.
- Missing Supabase configuration returns a controlled unavailable response; it never exposes a secret or breaks onchain flows.

Create `lib/marketplace-metadata.ts` for typed browser requests and response normalization. Malformed remote rows are ignored rather than trusted.

## Validation and compatibility

- New description validation is added to `validateContractDraft`.
- Existing local records without `description` remain readable because the field is optional in `LocalContract` during migration.
- The existing onchain contract ABI and deployed escrow contracts are not changed.
- The existing local record continues to store the description as a fast same-browser fallback, but public display prefers server metadata when available.
- No description is included in settlement receipt verification or payment evidence.

## Testing

Add or update tests for:

- description required, trimmed length boundaries, and invalid drafts
- draft/local contract description round-trip
- metadata response normalization and malformed-row filtering
- public contract enrichment preserving onchain fields
- dashboard card and detail-page description rendering
- metadata unavailable without hiding valid public contracts
- API validation of addresses, description length, and onchain advertiser matching

Run the focused web tests, the existing web and Hardhat test suites, and a production build. Browser verification must check create form validation, a completed detail page, a public dashboard card, and the no-description fallback. Real wallet signing and production deployment are outside this feature’s code-change scope unless explicitly requested after verification.

## Non-goals

- No escrow contract redeployment or ABI change
- No editing workflow for already-published descriptions
- No change to funding, cross-chain bridge, application selection, milestone release, or receipt semantics
- No private or secret data in public metadata
