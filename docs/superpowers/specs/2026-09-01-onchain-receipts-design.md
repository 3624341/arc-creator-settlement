<<<<<<< HEAD
# Arc Creator Settlement v0.3 Onchain Receipts Design

## Goal

Turn every successful milestone release into a polished, public, independently verifiable receipt. A reviewer must be able to open a receipt without connecting a wallet and confirm the payment against Arc Testnet.

The immediate business objective is to strengthen the owner's Arc Discord/community application. The deployed v0.3 product, a real receipt URL, and its matching ArcScan transaction should serve as concise proof that the applicant is an active Arc builder and product owner rather than only a translator or marketer.

## Product Positioning

Arc Creator Settlement is a milestone settlement product, not a generic block explorer. The v0.3 experience should make one product story obvious:

1. A client funds an escrow in USDC.
2. A creator submits a milestone.
3. The client releases payment.
4. The product publishes a permanent-looking receipt backed by an Arc transaction.

The interface will keep the existing rounded, approachable visual identity while adopting the strongest patterns from the supplied references: visible network state, concise status language, restrained information density, prominent verification links, and a clear primary action.

## Architectural Decision

Use a chain-first hybrid receipt model.

- The canonical receipt URL is `/receipt/<transaction-hash>`.
- Arc RPC is the source of truth. The app accepts a receipt only when the transaction succeeded and contains a `PaymentReleased` event emitted by a milestone escrow.
- Supabase is an optional verified index for recent-receipt discovery. It never overrides onchain values and is not required to render a receipt.
- The existing `MilestoneEscrow` contract already emits all payment-specific fields needed for verification, so v0.3 does not require a contract change or redeployment.

This model keeps public verification working even when Supabase is unconfigured or unavailable, while allowing a deployed app to build a receipt history once server credentials are configured.

## Receipt Data Model

A normalized `SettlementReceipt` contains:

- `txHash`: canonical Arc transaction hash and public receipt identifier
- `status`: `confirmed`
- `chainId`: `5042002` by default, taken from app configuration
- `blockNumber`: confirmed block number
- `confirmedAt`: timestamp of the block containing the release
- `escrowAddress`: contract that emitted `PaymentReleased`
- `clientAddress`: value read from the escrow contract
- `creatorAddress`: recipient emitted by `PaymentReleased`
- `milestoneIndex`: emitted milestone identifier
- `milestoneDescription`: value read from `getMilestone`
- `amountUsdc`: emitted token amount formatted with six USDC decimals
- `projectTitle`: value read from the escrow contract
- `explorerUrl`: ArcScan transaction URL

Transaction calldata, database rows, query strings, and local storage are not trusted sources for receipt payment values.

## Verification Flow

`loadSettlementReceipt(txHash)` will:

1. Validate the transaction-hash format.
2. Load the transaction receipt from Arc RPC.
3. Reject missing, reverted, or unconfirmed transactions.
4. Decode logs using the escrow ABI and select exactly one `PaymentReleased` event.
5. Treat the emitting address as the escrow contract.
6. Read `client`, `creator`, `title`, and `getMilestone(milestoneIndex)` at the confirmed block.
7. Confirm that the event creator and contract creator match and that the milestone is marked released.
8. Load the block timestamp and return the normalized receipt.

Invalid hashes, unrelated transactions, RPC failures, and inconsistent contract state produce distinct user-facing error states. The page never renders an unrelated transaction as a settlement receipt.

## Release-to-Receipt Flow

### Browser wallet

After `approveAndRelease` submits, the app waits for the transaction receipt. When confirmed, it stores the transaction hash in local receipt history, requests optional server indexing, and shows a direct `View receipt` action.

### Circle user-controlled wallet

The Circle SDK currently returns a challenge rather than the Arc hash. Before requesting execution, the app records the latest block. After approval, it polls a narrow block range for a `PaymentReleased` event matching the escrow, milestone index, and creator. When found, it stores and indexes that transaction hash and exposes the same receipt action. Polling is bounded and reports an indexing delay without claiming failure when Circle approval succeeded.

## Supabase Index

Add a `settlement_receipts` table keyed by `tx_hash`. Stored values mirror the normalized receipt and include `created_at`.

Security model:

- Row-level security is enabled.
- Anonymous users may read confirmed public receipts.
- Anonymous and authenticated clients may not insert, update, or delete receipts.
- A server route verifies the transaction from Arc RPC before an upsert.
- The server-only Supabase secret key is never exposed through `NEXT_PUBLIC_` variables.
- When Supabase environment variables are absent, indexing returns a non-fatal `disabled` result and the chain-backed receipt remains available.

The existing `projects`, `milestones`, and `settlement_events` tables are not required for v0.3 receipt rendering and will not be coupled to the new route.

## Routes and Components

### `/receipt/[txHash]`

A public receipt page with:

- confirmed status seal
- project and milestone names
- large USDC amount
- recipient and client addresses
- escrow address, block number, chain ID, and timestamp
- full transaction hash with copy control
- `Verify on ArcScan` primary action
- `Copy receipt link` secondary action
- clear loading, invalid, unrelated, reverted, and RPC-unavailable states

The page is mobile-first and does not require a wallet session.

### Contract detail

The release action gains a pending/confirmed state. A confirmed release shows `View receipt` and does not mark the milestone paid optimistically before chain confirmation.

### Dashboard

Add a compact `Recent receipts` section sourced from local history first and optionally enriched by Supabase. Each row exposes amount, project, timestamp, shortened hash, confirmed status, and a receipt link. Empty state copy directs the user to release a milestone.

### Shared shell and visual system

Make the header responsive, add a receipts navigation entry, strengthen focus states, and introduce reusable status, address, and copy treatments. Preserve the current warm background and rounded forms while reducing excessive pill usage and improving hierarchy. No decorative animation or dashboard feature is added unless it supports verification.

## Server Boundaries

- Receipt verification code runs on the server for the public page and indexing route.
- Wallet interactions remain client-side.
- Shared parsing and formatting functions are pure and separately testable.
- Route parameters follow Next.js 15 asynchronous `params` conventions.
- RPC requests use the configured Arc Testnet endpoint and opt out of stale caching for receipt verification.

## Testing Strategy

Use test-driven development for every new behavior.

- Unit tests cover hash validation, `PaymentReleased` decoding, receipt normalization, address consistency, and USDC formatting.
- Hardhat tests assert the emitted `PaymentReleased` fields and transaction receipt behavior used by the web app.
- Route-level tests cover invalid hashes, unrelated transactions, reverted transactions, successful verification, and optional Supabase indexing failure.
- Component tests cover confirmed receipt details, copy affordances, and error states where practical.
- Full verification runs contract tests, frontend tests, TypeScript/Next.js production build, and an in-browser walkthrough at desktop and mobile widths with console-error inspection.

## Success Criteria

- A real `approveAndRelease` transaction produces a working public receipt URL.
- The Discord/community application can link directly to one deployed product, one receipt, one ArcScan transaction, and one public repository without relying on unverified claims.
- The receipt is readable without a wallet or login.
- Every displayed payment fact is derived from or checked against Arc onchain data.
- ArcScan opens the exact transaction shown on the receipt.
- Circle and browser-wallet release paths both surface a receipt when the transaction can be located.
- Supabase unavailability does not break receipt rendering or release completion.
- No secret key is shipped to the browser.
- The main receipt flow works at 375 px and 1280 px widths with no blocking console errors.
- Existing escrow contract tests and the Next.js production build pass.

## Explicit Non-Goals

- No smart-contract upgrade or redeployment
- No PDF generation, NFT receipt, QR code, email delivery, authentication, or mainnet support
- No fabricated transaction, user, volume, or settlement metrics
- No broad rewrite of Circle wallet onboarding
- No dependency on Supabase for cryptographic or payment verification
=======
# Arc Creator Settlement v0.3 Onchain Receipts Design

## Goal

Turn every successful milestone release into a polished, public, independently verifiable receipt. A reviewer must be able to open a receipt without connecting a wallet and confirm the payment against Arc Testnet.

The immediate business objective is to strengthen the owner's Arc Discord/community application. The deployed v0.3 product, a real receipt URL, and its matching ArcScan transaction should serve as concise proof that the applicant is an active Arc builder and product owner rather than only a translator or marketer.

## Product Positioning

Arc Creator Settlement is a milestone settlement product, not a generic block explorer. The v0.3 experience should make one product story obvious:

1. A client funds an escrow in USDC.
2. A creator submits a milestone.
3. The client releases payment.
4. The product publishes a permanent-looking receipt backed by an Arc transaction.

The interface will keep the existing rounded, approachable visual identity while adopting the strongest patterns from the supplied references: visible network state, concise status language, restrained information density, prominent verification links, and a clear primary action.

## Architectural Decision

Use a chain-first hybrid receipt model.

- The canonical receipt URL is `/receipt/<transaction-hash>`.
- Arc RPC is the source of truth. The app accepts a receipt only when the transaction succeeded and contains a `PaymentReleased` event emitted by a milestone escrow.
- Supabase is an optional verified index for recent-receipt discovery. It never overrides onchain values and is not required to render a receipt.
- The existing `MilestoneEscrow` contract already emits all payment-specific fields needed for verification, so v0.3 does not require a contract change or redeployment.

This model keeps public verification working even when Supabase is unconfigured or unavailable, while allowing a deployed app to build a receipt history once server credentials are configured.

## Receipt Data Model

A normalized `SettlementReceipt` contains:

- `txHash`: canonical Arc transaction hash and public receipt identifier
- `status`: `confirmed`
- `chainId`: `5042002` by default, taken from app configuration
- `blockNumber`: confirmed block number
- `confirmedAt`: timestamp of the block containing the release
- `escrowAddress`: contract that emitted `PaymentReleased`
- `clientAddress`: value read from the escrow contract
- `creatorAddress`: recipient emitted by `PaymentReleased`
- `milestoneIndex`: emitted milestone identifier
- `milestoneDescription`: value read from `getMilestone`
- `amountUsdc`: emitted token amount formatted with six USDC decimals
- `projectTitle`: value read from the escrow contract
- `explorerUrl`: ArcScan transaction URL

Transaction calldata, database rows, query strings, and local storage are not trusted sources for receipt payment values.

## Verification Flow

`loadSettlementReceipt(txHash)` will:

1. Validate the transaction-hash format.
2. Load the transaction receipt from Arc RPC.
3. Reject missing, reverted, or unconfirmed transactions.
4. Decode logs using the escrow ABI and select exactly one `PaymentReleased` event.
5. Treat the emitting address as the escrow contract.
6. Read `client`, `creator`, `title`, and `getMilestone(milestoneIndex)` at the confirmed block.
7. Confirm that the event creator and contract creator match and that the milestone is marked released.
8. Load the block timestamp and return the normalized receipt.

Invalid hashes, unrelated transactions, RPC failures, and inconsistent contract state produce distinct user-facing error states. The page never renders an unrelated transaction as a settlement receipt.

## Release-to-Receipt Flow

### Browser wallet

After `approveAndRelease` submits, the app waits for the transaction receipt. When confirmed, it stores the transaction hash in local receipt history, requests optional server indexing, and shows a direct `View receipt` action.

### Circle user-controlled wallet

The Circle SDK currently returns a challenge rather than the Arc hash. Before requesting execution, the app records the latest block. After approval, it polls a narrow block range for a `PaymentReleased` event matching the escrow, milestone index, and creator. When found, it stores and indexes that transaction hash and exposes the same receipt action. Polling is bounded and reports an indexing delay without claiming failure when Circle approval succeeded.

## Supabase Index

Add a `settlement_receipts` table keyed by `tx_hash`. Stored values mirror the normalized receipt and include `created_at`.

Security model:

- Row-level security is enabled.
- Anonymous users may read confirmed public receipts.
- Anonymous and authenticated clients may not insert, update, or delete receipts.
- A server route verifies the transaction from Arc RPC before an upsert.
- The server-only Supabase secret key is never exposed through `NEXT_PUBLIC_` variables.
- When Supabase environment variables are absent, indexing returns a non-fatal `disabled` result and the chain-backed receipt remains available.

The existing `projects`, `milestones`, and `settlement_events` tables are not required for v0.3 receipt rendering and will not be coupled to the new route.

## Routes and Components

### `/receipt/[txHash]`

A public receipt page with:

- confirmed status seal
- project and milestone names
- large USDC amount
- recipient and client addresses
- escrow address, block number, chain ID, and timestamp
- full transaction hash with copy control
- `Verify on ArcScan` primary action
- `Copy receipt link` secondary action
- clear loading, invalid, unrelated, reverted, and RPC-unavailable states

The page is mobile-first and does not require a wallet session.

### Contract detail

The release action gains a pending/confirmed state. A confirmed release shows `View receipt` and does not mark the milestone paid optimistically before chain confirmation.

### Dashboard

Add a compact `Recent receipts` section sourced from local history first and optionally enriched by Supabase. Each row exposes amount, project, timestamp, shortened hash, confirmed status, and a receipt link. Empty state copy directs the user to release a milestone.

### Shared shell and visual system

Make the header responsive, add a receipts navigation entry, strengthen focus states, and introduce reusable status, address, and copy treatments. Preserve the current warm background and rounded forms while reducing excessive pill usage and improving hierarchy. No decorative animation or dashboard feature is added unless it supports verification.

## Server Boundaries

- Receipt verification code runs on the server for the public page and indexing route.
- Wallet interactions remain client-side.
- Shared parsing and formatting functions are pure and separately testable.
- Route parameters follow Next.js 15 asynchronous `params` conventions.
- RPC requests use the configured Arc Testnet endpoint and opt out of stale caching for receipt verification.

## Testing Strategy

Use test-driven development for every new behavior.

- Unit tests cover hash validation, `PaymentReleased` decoding, receipt normalization, address consistency, and USDC formatting.
- Hardhat tests assert the emitted `PaymentReleased` fields and transaction receipt behavior used by the web app.
- Route-level tests cover invalid hashes, unrelated transactions, reverted transactions, successful verification, and optional Supabase indexing failure.
- Component tests cover confirmed receipt details, copy affordances, and error states where practical.
- Full verification runs contract tests, frontend tests, TypeScript/Next.js production build, and an in-browser walkthrough at desktop and mobile widths with console-error inspection.

## Success Criteria

- A real `approveAndRelease` transaction produces a working public receipt URL.
- The Discord/community application can link directly to one deployed product, one receipt, one ArcScan transaction, and one public repository without relying on unverified claims.
- The receipt is readable without a wallet or login.
- Every displayed payment fact is derived from or checked against Arc onchain data.
- ArcScan opens the exact transaction shown on the receipt.
- Circle and browser-wallet release paths both surface a receipt when the transaction can be located.
- Supabase unavailability does not break receipt rendering or release completion.
- No secret key is shipped to the browser.
- The main receipt flow works at 375 px and 1280 px widths with no blocking console errors.
- Existing escrow contract tests and the Next.js production build pass.

## Explicit Non-Goals

- No smart-contract upgrade or redeployment
- No PDF generation, NFT receipt, QR code, email delivery, authentication, or mainnet support
- No fabricated transaction, user, volume, or settlement metrics
- No broad rewrite of Circle wallet onboarding
- No dependency on Supabase for cryptographic or payment verification
>>>>>>> fbddcdeff66ac6e112e18b8097cbd14cf2ee1a72
