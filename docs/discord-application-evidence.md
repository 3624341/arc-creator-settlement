# Discord Application Evidence — Arc Creator Settlement v0.3

Use this as the evidence sheet for an Arc Discord/community application. Every onchain claim below is public and independently verifiable.

## Identity

- Builder / product owner: Dongkyun Seo
- Project: Arc Creator Settlement
- Version: v0.3
- GitHub: https://github.com/3624341/arc-creator-settlement
- Live product: https://arc-creator-settlement-v0-2.vercel.app

## Production deployment verification — 2026-09-10

- Source commit: [`f99aa7e`](https://github.com/3624341/arc-creator-settlement/commit/f99aa7e5183567910345f4a2665945492e556eca)
- Preview deployment: https://arc-creator-settlement-v0-2-ic9c59mem-sdg7929-1521.vercel.app
- Production deployment: https://arc-creator-settlement-v0-2-oaozqra04-sdg7929-1521.vercel.app
- Canonical production URL: https://arc-creator-settlement-v0-2.vercel.app
- Vercel status: `Ready` for Preview and Production
- Production build duration: `47s`

The deployed commit adds wallet-signed Creator Passport profiles, public creator pages, and advertiser-facing Applicant Cards. Production verification confirmed that the home page reports Arc Testnet online, the Supabase-backed dashboard lists one funded 1 USDC escrow and a confirmed receipt, the public receipt opens without a wallet, and `/profile/edit` correctly requires a browser-wallet connection before signing. The browser console reported no errors during these checks.

Current production receipt used for the deployment smoke test:

- Receipt: https://arc-creator-settlement-v0-2.vercel.app/receipt/0xe491bc671416c252f991056b13bc8253511297ca532619bf54321c76d259f928
- ArcScan: https://testnet.arcscan.app/tx/0xe491bc671416c252f991056b13bc8253511297ca532619bf54321c76d259f928
- Confirmed block: `61,267,146`
- Released amount: `1 USDC`

The final Creator Passport save is intentionally a wallet-owner check: the owner must connect the browser wallet and approve the `personal_sign` request. No seed phrase, private key, API key, or Supabase secret is part of this evidence.

## What was built

Arc Creator Settlement is a working Arc Testnet product for USDC-funded milestone agreements. Its v0.3 differentiator is a public receipt that reconstructs a payment from the confirmed `PaymentReleased` event and escrow state. The receipt can be shared and checked without a wallet, so a creator, client, reviewer, or community moderator sees the same independently verifiable settlement facts.

## Onchain evidence

- Arc Testnet factory: https://testnet.arcscan.app/address/0x5b90cdfecf1c59596e0b6b9cae448a29c2774e32
- Demo escrow: https://testnet.arcscan.app/address/0x22De463e9969b8Cef07b151b9cB5D8c5A16D81Df
- Milestone release transaction: `0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856`
- Public receipt: https://arc-creator-settlement-v0-2.vercel.app/receipt/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856
- ArcScan transaction: https://testnet.arcscan.app/tx/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856
- Confirmed block: `59,934,707`
- Released amount: `0.25 USDC`

## Verification claims reviewers can test

1. Open the receipt in an incognito browser; no wallet is required.
2. Compare its transaction hash, creator, USDC amount, and block with ArcScan.
3. Use an unrelated, reverted, or malformed transaction hash and confirm the UI does not label it as a settlement receipt.
4. Follow the GitHub implementation in `lib/receipts/chain.ts` and the negative-path tests in `web-test/receipt-chain.test.ts`.

## Suggested application summary

> I built Arc Creator Settlement v0.3, a USDC milestone escrow product on Arc Testnet. After a client releases a creator milestone, the app produces a public receipt backed by the confirmed PaymentReleased event and escrow state—not user-entered metadata. Anyone can open the receipt without a wallet, compare it with ArcScan, and inspect the verification code and negative-path tests in the public repository.

## Demo capture list

- Home page showing live Arc Testnet status
- Contract release confirmation and generated receipt link
- Public receipt in a clean/incognito browser
- ArcScan transaction with matching `PaymentReleased` values
- GitHub tests that reject invalid or mismatched transactions

A precise testnet claim is stronger than an unverified production or traction claim. Keep future additions tied to public evidence.

## Captures

- [`docs/evidence/arc-creator-settlement-receipt.png`](evidence/arc-creator-settlement-receipt.png)
- [`docs/evidence/arcscan-payment-release.png`](evidence/arcscan-payment-release.png)
