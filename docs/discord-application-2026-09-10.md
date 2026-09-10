# Arc Discord Builder Application — Arc Creator Settlement

## Applicant

- **Name:** Dongkyun Seo
- **Role:** Founder and Product Lead
- **Location:** Seoul, South Korea
- **LinkedIn:** https://www.linkedin.com/in/dongkyun-seo-97032a1a8/
- **GitHub:** https://github.com/3624341/arc-creator-settlement
- **Live product:** https://arc-creator-settlement-v0-2.vercel.app

## Short application answer

I am building **Arc Creator Settlement**, a programmable USDC milestone settlement product for creators, freelancers, advertisers, and marketplaces. It is live on Arc Testnet and supports escrow creation, creator applications, advertiser selection, USDC funding, milestone submission and release, and public onchain receipts that anyone can verify without connecting a wallet.

The latest release adds a wallet-signed **Creator Passport**, public creator profiles, advertiser-facing Applicant Cards, and job-specific applicant review inside both My Page and each job's detail page. I want to join the Arc Discord to learn from builders, receive direct feedback on contract security, wallet UX, marketplace design, and mainnet readiness, and use that feedback to turn this working testnet product into a successful service on Arc Mainnet.

## Full application

### Tell us about yourself

My name is **Dongkyun Seo**, and I am a product-oriented founder based in Seoul, South Korea. I have experience across product planning, design, marketing, early-stage startup operations, and software execution. I previously operated an IT startup and participated in startup support programs. I am also developing ideas around creator, influencer, actor, model, and advertiser marketplaces, which gave me a concrete reason to explore programmable settlement infrastructure.

I am leading the product strategy, UX, technical coordination, testing, deployment, and early go-to-market validation for Arc Creator Settlement.

LinkedIn: https://www.linkedin.com/in/dongkyun-seo-97032a1a8/

### What are you building?

**Arc Creator Settlement** is a USDC-native milestone settlement product for creator and freelance work. A client or advertiser creates a job with one or more payment milestones. The payment budget is committed to an escrow contract on Arc, and USDC is released only after the creator submits the agreed work and the advertiser approves the milestone.

The product is designed to solve more than one-time payment processing. Creator and marketplace work requires both sides to understand who was selected, what was promised, whether funds were committed, which milestone was completed, and whether payment was actually released. Arc Creator Settlement brings those facts into one verifiable workflow.

### What has been implemented?

The current Arc Testnet product includes:

- `EscrowFactory` and isolated milestone escrow contracts
- Jobs that can be created with a creator already assigned or left open for applications
- Creator applications signed by a browser wallet
- Onchain creator assignment by the advertiser before funding
- USDC approval, escrow funding, milestone submission, and payment release
- Browser-wallet and Circle Wallet transaction flows
- Circle Contracts-based deployment support
- A Supabase-backed shared application and receipt index
- Public receipts reconstructed from the confirmed `PaymentReleased` event and escrow state
- ArcScan links for independent transaction verification
- Loading, retry, cancellation, invalid transaction, and role-aware error states

The latest release also adds a **Creator Passport** system:

- Creators build a public profile containing roles, skills, languages, region, social links, portfolio work, availability, and work preferences.
- Profile changes require a browser-wallet `personal_sign` signature, proving control of the profile wallet.
- Social links and follower information are clearly marked as self-reported and are not mixed with onchain verification.
- **Arc Settlement Verified** is calculated only from confirmed settlement receipts.
- Advertisers can compare Applicant Cards by role, language, availability, portfolio, and confirmed Arc settlement history.
- Advertisers can review applicants in My Page and directly inside the relevant job detail page, then select a creator through the onchain `assignCreator` flow.
- Incomplete Creator Passport forms now explain each missing or invalid field with visible validation guidance.

### Why Arc?

Arc is a strong fit because this product is centered on programmable, transparent, USDC-denominated settlement rather than speculative token payments. Creator and freelance marketplaces need stable-value payments, predictable execution, public verification, and a path toward easier wallet onboarding. Arc and Circle infrastructure make it possible to build the payment workflow around USDC from the beginning.

The current MVP uses Arc Testnet as the execution and verification layer. The long-term goal is to make Arc the settlement layer that creator, freelance, casting, and other service marketplaces can integrate through reusable APIs or an SDK.

### Why do you want to join the Arc Discord?

I want to join the Arc Discord because I have reached the point where feedback from the Arc community can materially improve the product. I want to learn from experienced Arc builders, share what I have implemented, and receive practical feedback on:

- Smart contract security and escrow lifecycle design
- Wallet onboarding and transaction approval UX
- Reliable event indexing and production observability
- Marketplace application and creator-selection architecture
- Mainnet deployment, operational readiness, and controlled pilot design
- The best way to package the settlement flow for other marketplaces

My goal is not only to show a prototype. I want to use what I learn in the Arc community to improve the product, run a controlled real-world pilot, and successfully launch Arc Creator Settlement as a sustainable service on **Arc Mainnet**.

I also hope to contribute back by documenting lessons from building a Korean founder-led Arc product, sharing testnet implementation findings, and helping other early builders understand wallet, USDC, contract, and receipt-verification workflows.

### Current public evidence

- **Production application:** https://arc-creator-settlement-v0-2.vercel.app
- **Public GitHub repository:** https://github.com/3624341/arc-creator-settlement
- **Latest feature commit:** https://github.com/3624341/arc-creator-settlement/commit/76d399829b58cb20fe2f1a4cf8123c05a092fc78
- **Arc Testnet chain ID:** `5042002`
- **EscrowFactory:** https://testnet.arcscan.app/address/0x5b90cdfecf1c59596e0b6b9cae448a29c2774e32
- **Verified 0.25 USDC receipt:** https://arc-creator-settlement-v0-2.vercel.app/receipt/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856
- **Matching ArcScan transaction:** https://testnet.arcscan.app/tx/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856
- **Verified 1 USDC receipt:** https://arc-creator-settlement-v0-2.vercel.app/receipt/0xe491bc671416c252f991056b13bc8253511297ca532619bf54321c76d259f928
- **Matching ArcScan transaction:** https://testnet.arcscan.app/tx/0xe491bc671416c252f991056b13bc8253511297ca532619bf54321c76d259f928
- **Automated verification:** 4 smart contract tests and 77 web tests passing; Next.js production build passing

These are testnet product and transaction claims only. I am not claiming mainnet launch, production customers, revenue, or adoption that has not yet been independently verified.

### Mainnet direction

My next milestones are to gather technical and product feedback, improve security and observability, test the complete advertiser-to-creator workflow with controlled pilot users, and prepare a reviewed deployment process for Arc Mainnet. After validating the flow, I plan to expose the settlement functionality as reusable marketplace infrastructure rather than keeping it only as a standalone application.

## Concise Discord introduction

Hi Arc builders — I am **Dongkyun Seo**, a founder and product lead from Seoul. I am building **Arc Creator Settlement**, a live Arc Testnet product for USDC-funded creator and freelance milestone payments. The app now includes wallet-signed Creator Passports, job applications, advertiser applicant review and onchain creator selection, escrow funding and release, and public receipts verified against Arc transactions and contract state.

I joined because I want to learn from the Arc community and receive honest feedback on security, wallet UX, marketplace architecture, and mainnet readiness. My goal is to use that feedback to run a controlled pilot and successfully grow this into a real service on Arc Mainnet.

- Product: https://arc-creator-settlement-v0-2.vercel.app
- GitHub: https://github.com/3624341/arc-creator-settlement
- LinkedIn: https://www.linkedin.com/in/dongkyun-seo-97032a1a8/

## 한국어 확인용 요약

저는 서울에서 활동하는 창업자이자 프로덕트 리드 **서동균(Dongkyun Seo)**입니다. 현재 Arc Testnet에서 크리에이터·프리랜서·광고주·마켓플레이스를 위한 USDC 마일스톤 정산 서비스 **Arc Creator Settlement**를 개발하고 있습니다.

현재 서비스에는 스마트컨트랙트 에스크로, 크리에이터 지원, 광고주의 지원자 검토와 온체인 선정, USDC 예치와 마일스톤 지급, 누구나 지갑 없이 검증할 수 있는 공개 영수증이 구현되어 있습니다. 최근에는 지갑 서명 기반 Creator Passport, 공개 프로필, Applicant Card, 역할·언어·활동 상태·Arc 정산 이력 비교, 공고 상세페이지 안의 지원자 검토 기능까지 추가했습니다.

Arc Discord에서 많은 것을 배우고, 스마트컨트랙트 안전성·지갑 UX·마켓플레이스 구조·메인넷 준비에 관한 솔직한 피드백을 받고 싶습니다. 그 피드백을 실제 제품 개선과 파일럿에 반영해 Arc Creator Settlement를 **Arc Mainnet에서 성공하는 서비스**로 성장시키는 것이 목표입니다.

- LinkedIn: https://www.linkedin.com/in/dongkyun-seo-97032a1a8/
