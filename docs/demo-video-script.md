# 5-Minute Demo Video Script

## 0:00–0:25 — Problem

Global creator and freelancer payments are still slow, fragmented, and hard to manage by milestone. Businesses often rely on manual invoices, banks, FX, and off-platform trust. Creators wait days for international settlement.

## 0:25–0:55 — Product overview

Arc Creator Settlement turns a project agreement into a USDC-funded escrow on Arc. A client creates milestones, deposits USDC, and releases payment only when work is submitted and approved.

## 0:55–1:45 — User flow demo

Show homepage and dashboard.

Show Create Contract:

- Project title
- Creator wallet
- Milestone amounts
- Total USDC

Click Create Escrow.

Explain: this creates a milestone escrow contract on Arc through the factory contract.

## 1:45–2:40 — Funding and release demo

Open contract detail page.

Show:

- Approve USDC
- Deposit to escrow
- Creator submits milestone
- Client approves and releases USDC

Open ArcScan transaction link.

## 2:40–3:45 — Code walkthrough

Show:

- `contracts/MilestoneEscrow.sol`
- `contracts/EscrowFactory.sol`
- `lib/arc.ts`
- `lib/abi.ts`
- `app/contracts/[id]/page.tsx`

Explain:

- USDC is transferred into escrow with `transferFrom`
- Creator submits milestone
- Client calls `approveAndRelease`
- Contract transfers USDC directly to creator wallet

## 3:45–4:25 — Circle integration

Show:

- Circle wallet route
- Circle contract deployment route
- Environment configuration

Explain:

The MVP currently supports browser wallet execution and is structured to use Circle Wallets and Circle Contracts as the production onboarding and contract management layer.

## 4:25–5:00 — Roadmap

Explain:

Next, we will add Circle Gateway so businesses can fund Arc settlement contracts from USDC balances across supported chains, then pilot with creator and freelance workflows.
