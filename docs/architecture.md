# Architecture — Arc Creator Settlement

## Product thesis

Arc Creator Settlement is a programmable settlement layer for creator, freelance, and marketplace payments. The product turns a project agreement into a USDC-funded milestone escrow on Arc.

## System architecture

```text
Client / Business
      │
      │ Create project + fund USDC
      ▼
Next.js App ─────── Circle Wallets / Browser Wallet
      │
      │ Contract calls
      ▼
Arc Testnet
      │
      ├── EscrowFactory.sol
      └── MilestoneEscrow.sol
              │
              │ Release USDC by approved milestone
              ▼
Creator Wallet
```

## Circle and Arc alignment

- **Arc:** settlement execution layer.
- **USDC:** unit of account and payment asset.
- **Circle Wallets:** user onboarding and wallet infrastructure.
- **Circle Contracts:** contract deployment and management path.
- **Circle Gateway:** roadmap item for unified cross-chain USDC liquidity into Arc escrow flows.

## Why this is not only a marketplace app

The MVP starts with creator payment workflows, but the long-term product is infrastructure. Any marketplace that needs milestone-based payments can integrate the same escrow flow through an API or SDK.
