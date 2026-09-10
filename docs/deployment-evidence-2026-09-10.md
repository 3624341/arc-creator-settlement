# Creator Passport Deployment Evidence — 2026-09-10

This record documents the Preview and Production deployment of the Creator Passport release. It reports only checks completed against the public application and repository.

## Source

- Repository: https://github.com/3624341/arc-creator-settlement
- Branch deployed to Preview: `codex/creator-passport`
- Branch deployed to Production: `main`
- Commit: [`f99aa7e5183567910345f4a2665945492e556eca`](https://github.com/3624341/arc-creator-settlement/commit/f99aa7e5183567910345f4a2665945492e556eca)

## Vercel deployments

- Preview: https://arc-creator-settlement-v0-2-ic9c59mem-sdg7929-1521.vercel.app
- Preview deployment ID: `GYtF7eug7x3BFWNEeduyox9QNYA5`
- Production: https://arc-creator-settlement-v0-2-oaozqra04-sdg7929-1521.vercel.app
- Production deployment ID: `32uyD5U7AEKEgUzUdVbQyk42kzQm`
- Canonical production URL: https://arc-creator-settlement-v0-2.vercel.app
- Result: both deployments reached `Ready`
- Production build duration: `47s`

The required Arc, Circle, Supabase, and escrow variables were scoped to Preview and Production as appropriate. Secret values were not copied into this file, browser output, source control, or public client variables.

## Automated verification

- Solidity/Hardhat tests: `4 passing`
- Node/React web tests: `73 passing`
- Next.js production build: successful
- Build warning: Next.js detected a parent `package-lock.json`; this did not fail the build or affect the deployed project output.

## Public production smoke test

The following checks were completed against https://arc-creator-settlement-v0-2.vercel.app:

1. `/` loaded with the expected product metadata and reported Arc Testnet online at chain ID `5042002`.
2. `/dashboard` loaded one funded escrow with `1 USDC` held and one confirmed recent receipt.
3. `/receipt/0xe491bc671416c252f991056b13bc8253511297ca532619bf54321c76d259f928` loaded without a wallet and showed `1 USDC`, block `61,267,146`, Arc Testnet, and a matching ArcScan link.
4. `/profile/edit` loaded and required a browser-wallet connection before a Creator Passport can be signed.
5. No browser console errors were reported during the profile editor check.

## Wallet-owner verification still required

Saving a Creator Passport requires the profile wallet to approve a `personal_sign` request. That approval cannot be performed by a deployer or reviewer on behalf of the owner. The wallet owner should connect the same browser wallet, open `/profile/edit`, preview the profile, sign, save, and then verify the public `/creators/<wallet>` page.
