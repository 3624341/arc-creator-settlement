# Marketplace Visibility and Saved Jobs Design

**Date:** 2026-09-10  
**Status:** Approved design

## Goal

Give each connected wallet personal control over marketplace listings: hiding a created deployed job removes it from that wallet's Dashboard and My Page active list while preserving it in an Archived Jobs area, and saving a job with a star makes it available in a Saved Jobs area on My Page.

## Scope and assumptions

- Preferences are private to the currently connected wallet and stored in browser `localStorage`.
- Hiding does not delete or mutate an onchain escrow. It only changes whether that wallet's UI lists the job as active.
- A local draft may continue to use the existing `Delete` behavior. Deployed jobs use `Hide` and `Restore`.
- Dashboard shows all public listings when no wallet is connected. When a wallet is connected, it excludes only listings hidden by that wallet.
- Saved jobs remain available even if the user hides the same listing; Archive and Saved are independent preferences.
- The existing `creatorsettle.com` deployment and Supabase data model do not need changes for this feature.

## User experience

### Hide and archive

1. The advertiser selects `Hide` beside a deployed job in My Page.
2. The job disappears from My Page's active `Created Jobs` list.
3. The same job disappears from Dashboard for that connected wallet.
4. My Page shows an `Archived Jobs` section containing the hidden job.
5. Selecting `Restore` removes the wallet/job hidden key and returns the job to active lists.

### Save and unsave

1. Each public `ContractCard` shows a star button with an accessible label.
2. Selecting the star stores the wallet/job pair and changes the icon to the saved state.
3. My Page shows saved jobs in a `Saved Jobs` section, including title, status, amount, and an `Open settlement` link.
4. Selecting the star again on Dashboard or `Remove` in Saved Jobs deletes only that wallet/job pair.
5. When no wallet is connected, the star is disabled or prompts the user to connect a wallet rather than storing a global preference.

## Data model and interfaces

Extend `lib/marketplace-store.ts` with a wallet-scoped saved-jobs key and explicit preference helpers:

```ts
export const SAVED_CONTRACTS_STORAGE_KEY = "arc-saved-contracts";

export function getHiddenContractsForWallet(
  wallet: string,
  contracts: LocalContract[],
  storage?: StorageLike,
): LocalContract[];

export function restoreContractForWallet(
  wallet: string,
  contract: LocalContract,
  storage?: StorageLike,
): boolean;

export function saveContractForWallet(
  wallet: string,
  contract: LocalContract,
  storage?: StorageLike,
): boolean;

export function unsaveContractForWallet(
  wallet: string,
  contract: LocalContract,
  storage?: StorageLike,
): boolean;

export function isContractSaved(
  wallet: string,
  contract: LocalContract,
  storage?: StorageLike,
): boolean;

export function getSavedContractsForWallet(
  wallet: string,
  contracts: LocalContract[],
  storage?: StorageLike,
): LocalContract[];
```

Hidden and saved values use the same normalized key convention as existing hidden records: `<lowercase-wallet>:<lowercase-escrow-address-or-local-id>`. Malformed storage is treated as empty, duplicate keys are removed on write, and a missing wallet or storage returns an empty list/`false` without throwing.

## Component and page changes

- `app/dashboard/page.tsx`
  - Resolve the active Circle or browser wallet using the existing wallet storage conventions.
  - Filter merged public/local contracts with `isContractHidden` before calculating stats and rendering cards.
  - Pass wallet and a save-toggle callback into `ContractCard`.
  - Keep the no-wallet dashboard public and render star buttons as unavailable until a wallet is connected.

- `components/ContractCard.tsx`
  - Accept `wallet?: string` and an optional `onSavedChange` callback.
  - Render a star button using `lucide-react` with `aria-pressed` and labels `Save job`/`Remove saved job`.
  - Keep navigation to the settlement page separate from the star button so clicking the star never opens the job.

- `app/profile/page.tsx`
  - Keep an unfiltered `allContracts` state so hidden jobs can be displayed and restored after public RPC refreshes.
  - Derive active created/assigned lists, archived created jobs, and saved jobs from the current contract set and wallet.
  - Add `Archived Jobs` with `Restore` controls.
  - Add `Saved Jobs` with links and `Remove` controls.
  - Update the created-job count and empty copy to reflect active jobs only.

- `web-test/marketplace-store.test.ts`
  - Add storage-level tests for restore, save, unsave, wallet isolation, malformed storage, and contract ID/escrow address aliases.

- `web-test/marketplace-ui.test.ts` and a focused card test if needed
  - Assert Dashboard filters hidden contracts, My Page exposes archive/restore and saved sections, and ContractCard uses an accessible star toggle.

## Error handling and compatibility

- Browser storage failures leave the UI usable; preference operations return `false` and the current list remains unchanged.
- Public RPC failures preserve the last local contract set, including enough data to render archived and saved jobs when available.
- Existing application, receipt, and onchain contract flows are unchanged.
- Hidden records remain compatible with the current `HIDDEN_CONTRACTS_STORAGE_KEY` format.

## Verification

1. Run focused store tests and observe the new tests fail before implementation.
2. Implement the minimal store helpers and rerun focused tests.
3. Add page/card assertions, then run the focused UI tests.
4. Run `npm run test:web`.
5. Run `npm run build`.
6. Start the dev server and manually verify: hide on My Page, Dashboard filtering, Archived Jobs restore, star save/unsave, Saved Jobs remove, and no-wallet behavior.
