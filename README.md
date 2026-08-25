# Arc Creator Settlement

**Programmable USDC milestone settlement on Arc for global creators, freelancers, and marketplaces.**

Arc Creator Settlement is a Circle Grants–oriented working MVP codebase. A client funds a milestone agreement in USDC; a creator submits work; the client approves milestones; and the smart contract releases USDC on Arc.

## Implemented in this repository

- Next.js / TypeScript product UI
- Arc Testnet configuration and ArcScan links
- `MilestoneEscrow.sol` and `EscrowFactory.sol`
- USDC approve / deposit / milestone release flow
- Circle **User-Controlled Wallets** PIN flow for ARC-TESTNET SCA wallets
- Circle Wallet contract-execution challenges from the web app
- Circle **Developer-Controlled Wallet** setup script for the deployer
- Circle **Contracts** deployment script for custom EscrowFactory bytecode on ARC-TESTNET
- Browser-wallet fallback for development/debugging
- Hardhat tests and local MockUSDC
- Optional Supabase schema
- Grant application, roadmap, architecture, pitch deck outline, demo script, and checklist

## Core flow

1. Client creates/loads a Circle User-Controlled Wallet on Arc Testnet.
2. Client calls `EscrowFactory.createEscrow()` through a Circle wallet authorization challenge.
3. Client approves USDC and deposits the full milestone budget into the escrow contract.
4. Creator submits milestone completion.
5. Client approves the milestone.
6. Escrow releases the milestone's USDC to the creator.
7. Product surfaces onchain status and ArcScan links.

## What still requires the applicant's credentials

No secret credentials are bundled in this repository. Before a live Arc Testnet deployment, the applicant must configure:

- Circle Testnet API Key
- Circle Entity Secret
- Circle User-Controlled Wallet App ID
- Arc Testnet faucet funding for the Circle deployer wallet

See **`SETUP_NEXT_STEPS_KR.md`** for the exact minimal steps. Never put API keys, Entity Secrets, private keys, or recovery files in chat or GitHub.

## Quick start

```bash
npm install
copy .env.example .env.local
npm run dev
```

On macOS/Linux use `cp .env.example .env.local`.

Open `http://localhost:3000`.

## Circle / Arc deployment

After Circle credentials are stored in `.env.local`:

```bash
npm run circle:wallet
```

Fund the printed **public Arc Testnet deployer address** with faucet USDC, copy the returned Wallet Set / Wallet IDs into `.env.local`, then:

```bash
npm run circle:deploy
```

Put the deployed factory address into:

```bash
NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=0x...
```

## Tests

```bash
npm run test
```

## Grant materials

- `docs/grant-application.md`
- `docs/demo-video-script.md`
- `docs/technical-roadmap.md`
- `docs/architecture.md`
- `docs/submission-checklist.md`
- `Arc_Creator_Settlement_Pitch_Deck.pptx`

All traction/deployment claims should be replaced with actual public transactions before submission. The package intentionally does not fabricate metrics or integrations.
