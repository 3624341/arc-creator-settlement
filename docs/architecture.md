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
      │
      │ PaymentReleased transaction hash
      ▼
Public Receipt Verifier ─── Arc RPC + escrow state at confirmed block
      │
      └── Optional verified Supabase index
```

## Receipt trust model

The receipt URL contains only an Arc transaction hash. The server requires a successful transaction, exactly one decodable `PaymentReleased` event, matching creator and amount values, and a released milestone in the emitting escrow at the confirmed block. Project and milestone labels are read from that escrow rather than accepted from URL parameters or browser storage.

The optional Supabase table is a discovery index, not the source of truth. Its write path re-runs the same Arc verification before storing a receipt, while individual receipt pages continue to work without Supabase.

## Circle and Arc alignment

- **Arc:** settlement execution layer.
- **USDC:** unit of account and payment asset.
- **Circle Wallets:** user onboarding and wallet infrastructure.
- **Circle Contracts:** contract deployment and management path.
- **Circle Gateway:** roadmap item for unified cross-chain USDC liquidity into Arc escrow flows.

## Why this is not only a marketplace app

The MVP starts with creator payment workflows, but the long-term product is infrastructure. Any marketplace that needs milestone-based payments can integrate the same escrow flow through an API or SDK.
