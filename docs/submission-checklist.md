# Arc Creator Settlement v0.3 — Submission Checklist

## Product proof

- [x] Public onchain receipt implementation
- [x] Receipt verifier checks Arc transaction, event, creator, amount, and released milestone state
- [x] Receipt loading, invalid, reverted, missing-event, ambiguous-event, and mismatch states
- [x] Browser-wallet and Circle-wallet release tracking
- [x] Responsive home, dashboard, receipt, and navigation UI
- [x] Contract and web test suites
- [x] Vercel production URL added to README and application evidence
- [x] Creator Passport and Applicant Card source deployed from commit `f99aa7e`
- [x] Preview and Production deployments reached Vercel `Ready`
- [x] Production home, dashboard, receipt, and profile editor smoke-tested
- [x] Arc Testnet factory address configured
- [x] Real escrow funded and milestone released
- [x] Public receipt URL verified without a connected wallet
- [x] Matching ArcScan transaction link recorded

## Circle / deployment

- [x] Circle Testnet API key stored only in deployment environment
- [x] Circle Entity Secret registered locally and excluded from Git
- [x] User-Controlled Wallet App ID configured
- [x] Circle deployer wallet funded with Arc Testnet USDC
- [x] Supabase server variables configured in Vercel without exposing the secret
- [x] Supabase-backed production receipt/dashboard read path verified
- [ ] Creator Passport signed write re-tested by the wallet owner after deployment
- [x] Vercel production build completed without exposed secrets

## Discord / application package

- [x] GitHub repository shows v0.3 README and Creator Passport source
- [x] `docs/discord-application-evidence.md` placeholders replaced with real URLs
- [ ] 60–90 second demo recorded: create → release → receipt → ArcScan
- [ ] Screenshots include desktop receipt, mobile receipt, and matching ArcScan event
- [x] Submission wording claims only functionality and transactions that can be independently verified

## Final checks

- [x] `npm run test` — 4 passing
- [x] `npm run test:web` — 73 passing
- [x] `npm run build` — successful
- [x] No `.env.local`, API key, Entity Secret, private key, or recovery file in GitHub
- [x] Receipt URL works without a connected wallet
- [x] Transaction hash, creator, amount, milestone, block, and timestamp agree with ArcScan
