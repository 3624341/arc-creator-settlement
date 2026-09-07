# Wallet Profile Marketplace Design

## Goal

Add a wallet-linked profile page so one wallet can act as both an advertiser and a creator. Advertisers can review jobs they created and their applicants; creators can review applications they submitted, selected work, milestone progress, and payment status.

## Scope

The first version is client-side and uses the existing localStorage contract store. It does not add a database, messaging, search, notifications, or permissioned backend APIs.

## Routes and navigation

- Add `/profile` as the wallet-linked profile page.
- Add a `My Page` navigation entry in the shared shell.
- If no wallet is connected, show a clear connect-wallet prompt rather than an empty dashboard.
- Preserve existing contract and receipt routes.

## Data model

Use normalized localStorage records keyed by wallet address. Existing contract records remain compatible.

```ts
type ApplicationStatus = "Applied" | "Selected" | "Rejected" | "Completed";

type JobApplication = {
  id: string;
  contractId: string;
  applicant: string;
  status: ApplicationStatus;
  appliedAt: string;
};

type LocalContract = {
  id: string;
  title: string;
  creator: string;
  advertiser?: string;
  totalUsdc: string;
  status: string;
  escrowAddress?: string;
  applications?: JobApplication[];
};
```

The connected wallet is the advertiser when it matches `advertiser` or the legacy contract owner/client field, and a creator when it appears as an application applicant or creator address. A wallet may appear in both views simultaneously.

## User flows

### Advertiser

1. Connect a wallet.
2. Open My Page.
3. View created jobs and total budget.
4. Open a job to inspect applications and contract milestones.

### Creator

1. Connect a wallet.
2. Open a job detail page.
3. Apply with the connected wallet when no application exists.
4. Open My Page.
5. View application status and, when selected, milestone progress and payment state.

## UI structure

`/profile` contains:

- Wallet identity card with shortened address and network label.
- Summary cards: Created jobs, Applications, Active work, Paid USDC.
- Tabs: `Created Jobs`, `My Applications`, `Active Work`.
- Empty states with links to Create Contract or Dashboard.
- Job cards linking to `/contracts/[id]`.

The job detail page adds an `Apply as creator` action for connected wallets. After applying, it changes to a non-duplicating applied state and stores the application locally.

## Persistence and compatibility

- Keep the existing `arc-settlement-contracts` key and extend records without breaking old entries.
- Add `arc-job-applications` for normalized application records.
- Normalize malformed or missing arrays to empty arrays on read.
- Never store private keys, seed phrases, or wallet signing data.
- The localStorage layer should be isolated in a small client utility so a future database adapter can replace it.

## Error and edge handling

- Require a connected wallet before applying.
- Prevent duplicate applications for the same wallet and contract.
- Reject applying to a contract owned by the same wallet.
- Show a clear message when localStorage is unavailable or corrupted, while preserving the existing contract flow.
- Keep onchain milestone state authoritative on contract detail pages; local application status is explicitly labeled as application metadata.

## Testing

- Test application storage, duplicate prevention, owner prevention, and status filtering.
- Test profile page labels and empty states.
- Test the apply action renders only for a connected, non-owner wallet.
- Run the full web test suite and production build.

## Future extension points

- Replace localStorage adapters with a database/API.
- Add advertiser actions to select or reject applicants.
- Add authenticated applicant and advertiser permissions.
- Add notifications and search after a shared backend exists.
