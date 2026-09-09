# Creator Selection Marketplace Design

## Goal

Change the marketplace flow so an advertiser can create an escrow without assigning a creator, review shared applications, select one applicant, and then assign that wallet as the on-chain payout recipient before funding.

## Context and constraints

- `MilestoneEscrow.creator` is currently immutable and required in the constructor.
- Released USDC is transferred directly to the on-chain `creator` address, so an off-chain-only selection cannot safely change payout ownership.
- Existing deployed escrows must remain readable and operational; their creator and payout behavior must not change.
- New creator selection must be authorized by the escrow client/advertiser and must be impossible after funding begins.
- Shared applications use Supabase server routes and wallet signatures; no service-role/secret key may reach the browser.
- The implementation must preserve browser-wallet signing and existing Circle wallet behavior where arbitrary signing is not available.

## Proposed architecture

### 1. Versioned on-chain assignment

Update the Solidity escrow used by the current factory so `creator` is mutable only while the escrow is unfunded and unassigned. The constructor accepts the zero address for an unassigned creator. Add:

- `assignCreator(address newCreator)`, callable only by `client`.
- A nonzero-address check.
- A guard that rejects assignment after funding or once a creator is assigned.
- A guard that rejects `deposit` until a creator has been assigned.
- `CreatorAssigned` event.

Existing contracts deployed with a nonzero immutable creator remain compatible through the existing ABI/read paths. Because Solidity storage layout and bytecode cannot change for deployed contracts, the updated factory and escrow implementation must be deployed to new addresses. The app must use the new factory for new creations while retaining public read support for old escrow addresses.

### 2. Create flow

- Make Creator wallet optional in the form.
- Empty input is encoded as the zero address for the new factory.
- Keep strict validation when a value is provided.
- Persist an unassigned creator in local records as the zero address or an explicit empty value, and display “Not assigned yet” instead of a payout address.
- The advertiser remains the contract client/owner and can still cancel an unfunded escrow.

### 3. Shared application and selection flow

- Keep `job_applications` as the shared source of application status.
- Advertiser My Page lists applications received per created escrow, showing applicant wallet and status.
- Add a `Select creator` action for an `Applied` application.
- The advertiser signs a canonical selection message with a browser wallet, and the server verifies the signature against the contract client wallet before allowing the status transition.
- The server allows only the transition from `Applied` to `Selected`, and rejects selection of a second applicant once a selected application exists.
- The client sends `assignCreator(applicant)` on-chain, waits for confirmation, then updates the application status to `Selected`.
- If the chain transaction fails, the remote application remains `Applied` and the UI shows a retryable error.
- Selected creator receives creator actions; non-selected applicants see their status and cannot submit milestones.

### 4. Role and UI rules

- Contract owner/client: create, approve USDC, deposit, review applications, select creator, and release submitted milestones.
- Assigned creator: submit milestones after funding; cannot approve/deposit or apply to the same escrow.
- Unassigned third-party wallet: sees `Apply as creator` and can submit a signed application.
- Unassigned advertiser wallet: sees `Apply as creator` disabled/hidden and advertiser actions.
- Existing escrows with an assigned creator retain their current role behavior.

## Error handling

- Missing creator before funding: show “Select a creator before funding this escrow.”
- Attempt to assign after funding/assignment: surface the contract revert as a non-retryable state message and refresh on-chain state.
- Signature rejection: do not write or mutate application status.
- API unavailable: preserve local application fallback, but do not claim that a selection was shared until the server confirms it.
- Chain assignment succeeds but status update fails: show “Creator assigned onchain; refresh to sync application status” and provide a retry for the status update without re-sending the chain transaction.

## Testing and acceptance criteria

### Contract tests

- Create an escrow with zero creator.
- Reject deposit before assignment.
- Only the client can assign a creator.
- Assign a nonzero creator once and emit `CreatorAssigned`.
- Reject reassignment and assignment after funding.
- Assigned creator can submit and receives release payment.
- Existing preassigned creator flow remains passing.

### Web tests

- Empty creator passes draft validation; malformed nonempty creator fails.
- Create flow encodes an empty creator as zero address.
- Application API verifies the applicant signature and rejects invalid selection signatures.
- Advertiser sees received applications and can select exactly one.
- Selected application is reflected after reload; non-selected application remains `Applied` or becomes `Rejected` only through an explicit future action.

### End-to-end acceptance

1. Advertiser creates an escrow without a creator and confirms the contract shows “Not assigned yet.”
2. A different browser wallet signs an application.
3. Advertiser sees the application in My Page from another browser.
4. Advertiser selects the applicant and confirms `assignCreator` on Arc.
5. The selected wallet sees the creator role and can submit after funding.
6. A second applicant cannot be selected after the first assignment.

## Non-goals

- Migrating or rewriting already deployed escrow contracts.
- Adding a multi-applicant bidding or messaging system.
- Supporting Circle arbitrary message signatures in this iteration.
- Allowing an advertiser to change a creator after funding.
