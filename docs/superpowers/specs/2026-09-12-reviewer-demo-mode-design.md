# Reviewer Demo Mode Design

## Purpose

Add a public, read-only reviewer experience that lets an Arc community or Discord reviewer understand and verify Creator Settlement without connecting a wallet. The page should communicate the complete product story in roughly 90 seconds while keeping recorded product narrative separate from facts verified directly on Arc Testnet.

The feature improves review clarity and trust. It is not a simulated transaction environment, a replacement for the live application, or evidence of mainnet usage.

## Success criteria

- A logged-out visitor can understand the advertiser-to-creator settlement flow without a wallet.
- Opening the page does not access an injected wallet provider, request accounts, request signatures, add networks, or submit transactions.
- Recorded offchain steps and live onchain verification have visibly different trust labels.
- A confirmed milestone payment is re-verified through the existing Arc receipt verifier before it is shown as verified.
- RPC failure, an invalid transaction, or a verification mismatch never renders as payment success.
- English is the default language and Korean is available through an explicit language switch.
- The page links to the public receipt, ArcScan, source repository, Korean build guide, Builder Hub, and security disclosure.
- The experience works on mobile and is keyboard accessible.

## Scope

### Included

- A new `/demo` route using a wallet-free public layout.
- A home-page and site-navigation entry labeled `Reviewer Demo`.
- An English-first, bilingual recorded walkthrough.
- Six product stages: contract creation, creator application, creator selection, escrow funding, milestone submission, and payment release.
- Live verification of an existing Arc Testnet `PaymentReleased` transaction using the existing receipt verifier.
- Clear `Recorded product step`, `Verified on Arc Testnet`, and `Verification unavailable` states.
- A final evidence section linking to public technical and community resources.
- A separately labeled cross-chain engineering note that does not expose bridge actions.
- Automated tests for trust boundaries, rendering, error states, language switching, links, and regression behavior.

### Excluded

- Wallet connection or transaction execution on the demo page.
- Fake interactive transactions or fabricated marketplace activity.
- Mainnet claims.
- New smart contracts or contract deployment.
- Changes to escrow, release, Creator Passport, marketplace, favorites, archive, or cross-chain funding behavior.
- Treating Supabase, localStorage, screenshots, or curated metadata as proof of payment.

## Experience design

### Entry points

The home hero adds a prominent `View 90-second demo` action. Desktop and mobile navigation add a `Reviewer Demo` link. The existing `Create Contract` and `Dashboard` actions remain available.

### Public demo shell

The `/demo` page uses a public shell that contains product navigation and evidence links but no wallet connector. This prevents route entry from invoking wallet restoration logic in the interactive application shell.

The header presents:

- `Recorded Arc Testnet Demo`
- `Read only`
- `No wallet required`
- An explicit `English | 한국어` language switch

English is the default. Language selection is represented in the URL query string so the page remains shareable and does not depend on browser storage.

### Walkthrough

The main content is a numbered, vertically ordered story that adapts to a compact card layout on larger screens:

1. An advertiser creates a milestone contract.
2. A creator applies with a wallet-signed Creator Passport.
3. The advertiser reviews and selects the creator.
4. The advertiser funds the Arc escrow with USDC.
5. The creator submits milestone work.
6. The advertiser releases payment and the public receipt verifies it.

Steps 1 through 5 are labeled `Recorded product step`. Their copy explains product behavior without claiming that curated text or images are independent proof. The demo identity is displayed as `Demo Creator`; full public addresses appear only inside evidence details and ArcScan links.

Step 6 is labeled `Verified on Arc Testnet` only when the server-side receipt verifier confirms the transaction status, exactly one `PaymentReleased` event, matching creator and amount, and released milestone state at the confirmed block.

The verified payment card includes project, milestone, amount, recipient, block, time, escrow, public receipt, and ArcScan links. The final call to action links to the application, GitHub repository, Korean Arc build guide, Builder Hub, and security page.

### Cross-chain note

Cross-chain funding is shown after the primary settlement story as `Testnet engineering extension`, not as a required settlement step. The production demo exposes no bridge button and does not request a network change. It may link to technical documentation. It must not show a successful bridge badge unless both source and destination evidence can be verified from authoritative sources.

## Architecture

### Components

- `app/demo/page.tsx`: server-rendered route, language query handling, and onchain verification orchestration.
- `components/PublicDemoShell.tsx`: wallet-free header and navigation for the demo route.
- `components/ReviewerDemo.tsx`: presentational walkthrough, evidence disclosure, status labels, and resource links.
- `lib/reviewer-demo.ts`: immutable bilingual narrative data, known evidence identifiers, and view-model construction.
- `lib/receipts/chain.ts`: existing source of truth for payment verification; reused without weakening its checks.

Component boundaries keep curated narrative, live verification, and presentation independent. The demo view receives an explicit result type rather than inferring success from the presence of a transaction hash.

### Data flow

1. The server reads the requested language from the URL and falls back to English.
2. It loads immutable recorded walkthrough metadata from `lib/reviewer-demo.ts`.
3. It calls the existing `loadSettlementReceipt()` with the reviewed Arc Testnet release transaction hash.
4. A successful verification produces a `verified` payment view containing only verifier-derived values.
5. A verification error produces an `unavailable` view with a retry link and no payment-success claim.
6. The server passes the combined, typed result to the presentational component.

No browser wallet provider, Supabase write, localStorage value, or query-provided metadata participates in payment verification.

## Trust and safety rules

- The page never requests wallet connection, signatures, network additions, approvals, or transactions.
- Curated content uses `Recorded` rather than `Verified`.
- Only the existing Arc receipt verifier can produce `Verified on Arc Testnet`.
- External links clearly identify their destinations and open safely.
- The page states that Arc Testnet assets have no real-world value and does not claim mainnet readiness.
- The page does not display fake user counts, volume, testimonials, or partner relationships.
- The cross-chain extension remains informational while production execution is disabled.

## Error handling

- Arc RPC unavailable: show `Live verification temporarily unavailable`, preserve the recorded walkthrough, and provide a retry action.
- Transaction not found, reverted, missing event, ambiguous event, or state mismatch: show a specific non-success verification state derived from the existing receipt error presentation.
- Unsupported language value: fall back to English.
- Missing optional resource URL: omit the resource rather than render a broken link.

Timeouts and RPC failures are not presented as failed or reversed payments. Recorded narrative remains readable during external service outages.

## Accessibility and responsive behavior

- Use semantic headings, ordered stages, meaningful link text, and status text in addition to color.
- Ensure keyboard access to language controls and evidence disclosures.
- Preserve visible focus styles.
- Avoid horizontal scrolling for hashes and addresses by wrapping or truncating with an accessible full value.
- Use a single-column timeline on mobile and a wider evidence layout on desktop.

## Testing strategy

### Unit and rendering tests

- English is the default and Korean is selected only through the supported query value.
- All six stages appear in the intended order.
- Recorded steps never receive a verified status.
- A verifier success creates a verified payment view from verifier-derived data.
- Every receipt verification error creates a non-success view.
- Required evidence and resource links are present and correctly labeled.
- Missing optional resource URLs are omitted.

### Wallet isolation tests

- The demo route and components do not import browser-wallet utilities.
- Rendering the demo does not call `window.ethereum`, `eth_accounts`, `eth_requestAccounts`, `personal_sign`, `wallet_addEthereumChain`, or transaction methods.
- The public demo shell contains no wallet connection controls.

### Regression and delivery checks

- Run the focused reviewer demo tests.
- Run the complete web test suite.
- Run the Solidity tests to confirm no contract regression.
- Run the production build.
- Verify `/demo` in a logged-out browser at mobile and desktop widths.
- Confirm the browser console has no errors and the ArcScan and public receipt links resolve.

## Delivery boundaries

Implementation should be committed on the existing `codex/cross-chain-funding` branch while preserving unrelated generated TypeChain files and `tsconfig.tsbuildinfo`. Deployment, main-branch integration, and production-domain changes require separate verification and authorization.
