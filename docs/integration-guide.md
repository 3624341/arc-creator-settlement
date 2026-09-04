# Arc Creator Settlement integration guide

This guide describes the verified v0.3 flow and the contract boundaries a future marketplace integration can reuse. The current app exposes the flow through its UI; a stable external API/SDK is planned, not shipped.

## Arc Testnet configuration

```text
Chain ID: 5042002
USDC: 0x3600000000000000000000000000000000000000
EscrowFactory: 0x5b90cdfecf1c59596e0b6b9cae448a29c2774e32
RPC: https://rpc.testnet.arc.network
Explorer: https://testnet.arcscan.app
```

## Settlement lifecycle

1. Create an escrow with the creator address, title, milestone descriptions, and USDC amounts through `EscrowFactory`.
2. Approve the escrow to spend the required USDC with `approve(escrow, amount)`.
3. Fund the escrow with `deposit()`.
4. The creator submits completed work with `submitMilestone(milestoneId)`.
5. The client releases the approved milestone with `approveAndRelease(milestoneId)`.
6. The escrow transfers USDC and emits `PaymentReleased`.
7. Wait for the confirmed transaction, then share `/receipt/<transaction-hash>`.
8. The receipt verifier re-checks transaction success, the event, creator, amount, escrow state, block, and timestamp against Arc RPC.

## Circle Wallet path

Circle User-Controlled Wallets authorize the client-side contract calls. The app never receives or stores seed phrases or private keys. Browser wallets are also supported for testnet development.

## Verification checklist

- Confirm the transaction is successful on ArcScan.
- Confirm exactly one `PaymentReleased` event for the expected escrow and milestone.
- Confirm the milestone is released at the transaction block.
- Confirm the creator and amount match the escrow state.
- Use the public receipt link as the shareable evidence URL.

## Error handling

The UI maps wallet cancellation, insufficient funds, reverted transactions, duplicate state, and Arc RPC/network failures to actionable messages with a retry action. Integrators should treat a receipt as confirmed only after the onchain checks above pass.

## Reuse boundary

Shipped: Solidity escrow contracts, Circle Wallet/browser-wallet UI, public receipt verifier, ArcScan evidence, and tests.

Planned: a versioned REST/SDK surface for marketplaces, webhooks/event indexing, and Gateway-based cross-chain funding. Do not present those planned interfaces as available in an integration.

## Public demo

- Live app: https://arc-creator-settlement-v0-2.vercel.app
- Verified receipt: https://arc-creator-settlement-v0-2.vercel.app/receipt/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856
- ArcScan: https://testnet.arcscan.app/tx/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856
