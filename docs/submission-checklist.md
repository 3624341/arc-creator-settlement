# Arc Creator Settlement v0.3 — Submission Checklist

## Product proof

- [x] Public onchain receipt implementation
- [x] Receipt verifier checks Arc transaction, event, creator, amount, and released milestone state
- [x] Receipt loading, invalid, reverted, missing-event, ambiguous-event, and mismatch states
- [x] Browser-wallet and Circle-wallet release tracking
- [x] Responsive home, dashboard, receipt, and navigation UI
- [x] Contract and web test suites
- [ ] Vercel production URL added to README and application evidence
- [ ] Arc Testnet factory address configured
- [ ] Real escrow funded and milestone released
- [ ] Public receipt URL verified from a clean/incognito browser
- [ ] Matching ArcScan transaction link recorded

## Circle / deployment

- [ ] Circle Testnet API key stored only in deployment environment
- [ ] Circle Entity Secret registered and stored only server-side
- [ ] User-Controlled Wallet App ID configured
- [ ] Circle deployer wallet funded with Arc Testnet USDC
- [ ] Optional Supabase schema applied and server secret configured
- [ ] Vercel production build completed without exposed secrets

## Discord / application package

- [ ] GitHub repository shows v0.3 README and source
- [ ] `docs/discord-application-evidence.md` placeholders replaced with real URLs
- [ ] 60–90 second demo recorded: create → release → receipt → ArcScan
- [ ] Screenshots include desktop receipt, mobile receipt, and matching ArcScan event
- [ ] Submission wording claims only functionality and transactions that can be independently verified

## Final checks

- [ ] `npm run test`
- [ ] `npm run test:web`
- [ ] `npm run build`
- [ ] No `.env.local`, API key, Entity Secret, private key, or recovery file in GitHub
- [ ] Receipt URL works without a connected wallet
- [ ] Transaction hash, creator, amount, milestone, block, and timestamp agree with ArcScan
