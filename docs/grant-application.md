# Circle Grants Program — Application Draft

## Applicant Details

### Founder names, roles, bios

Dongkyun Seo, Founder and Product Lead, Seoul, South Korea. Dongkyun is a product-oriented founder with hands-on experience across product planning, design, marketing, and early-stage software execution. He has previously operated an IT startup and participated in startup support programs. He also has prior Arc ecosystem participation through an Arc hackathon, which led to a strong interest in building practical financial applications on Arc. For this grant, he is leading product strategy, UX, MVP coordination, and go-to-market validation for creator and marketplace settlement use cases.

## Project Abstract

### Project Name

Arc Creator Settlement

### One-line description

Programmable USDC settlement infrastructure on Arc for global creators, freelancers, and marketplace payments.

### What problem are you solving and why is it important?

Global creator and freelance work is increasingly cross-border, but payment infrastructure has not caught up. Businesses still rely on fragmented payment processors, manual invoices, bank transfers, card networks, and FX rails. This creates settlement delays, high fees, unclear payment status, and trust issues between clients and independent creators.

The problem is especially visible in creator commerce, influencer campaigns, casting, design work, development work, and other milestone-based freelance services. These workflows do not need only a payment button. They need programmable settlement: funds should be committed up front, released by agreed milestones, and visible to both sides.

### What is your solution to that problem?

Arc Creator Settlement turns a work agreement into a USDC-funded milestone escrow on Arc. A client creates a contract, defines the creator wallet and payment milestones, deposits USDC, and releases each milestone after the creator submits deliverables and the client approves them.

The initial MVP focuses on creator and freelancer agreements. The long-term vision is to become a settlement layer that other marketplaces can integrate through APIs and SDKs. Arc provides the financial execution layer, USDC is the settlement asset, Circle Wallets improves onboarding, Circle Contracts supports contract deployment and management, and Circle Gateway can later connect USDC liquidity from other supported chains into Arc-based settlement flows.

### Why hasn’t this problem been solved yet? What are the barriers?

Traditional payment systems are optimized for one-time transactions, not programmable milestone settlement. Marketplaces often solve this by becoming the custodian or by building complex internal ledgers, which increases operational, compliance, and trust burdens.

Existing crypto payment attempts have also struggled because users face volatile gas assets, poor wallet UX, fragmented liquidity, and unclear settlement guarantees. A practical solution needs stable-value payments, predictable infrastructure, transparent contract logic, and a user experience that feels closer to a normal marketplace flow. Arc and Circle infrastructure make this approach more viable because the product can be designed around USDC-native settlement rather than speculative crypto assets.

### Why are you and your team uniquely suited to solve this problem?

The project combines founder experience, product design, marketplace thinking, and direct interest in Arc-based financial applications. Dongkyun has previously operated a startup and worked across planning, design, marketing, and development coordination. He is also exploring a model, actor, influencer, and advertiser casting platform, which provides a concrete initial vertical where milestone settlement can be tested.

This gives the project a realistic first market: creator and casting-related work where brands need reliable payment commitments and creators need faster settlement. The team is intentionally starting with a focused MVP instead of building a full marketplace immediately, making the project more likely to ship and generate measurable Arc usage.

## Product Alignment Track

### Is your project currently live in production?

No. The current target is Arc Testnet MVP first, followed by a controlled mainnet pilot after technical validation and grant review.

### Are you live on Arc?

Target answer after deployment: Yes, live on Arc Testnet.

### Which other chain(s) are you currently live on?

N/A for MVP. The project is designed around Arc first.

### Which Circle products are currently integrated into your project?

After MVP completion:

- USDC
- Wallets
- Contracts

If Circle Wallets or Circle Contracts are not fully completed before submission, mark only the products that are actually integrated and explain the planned integration below.

### Which Circle products do you plan to integrate into your project?

- USDC
- Wallets
- Contracts
- Gateway

## Milestones and Timelines

### Milestone 1 — Arc Testnet MVP

Build and deploy the initial Arc Creator Settlement MVP. This includes the Next.js application, Arc Testnet configuration, EscrowFactory contract, MilestoneEscrow contract, USDC deposit flow, milestone submission, client approval, USDC release to creator wallets, and ArcScan transaction visibility.

### Milestone 2 — Circle Wallets onboarding

Add Circle wallet infrastructure to reduce user onboarding friction and make the product usable by non-crypto-native clients and creators. Implement wallet creation, wallet status, and transaction signing flows where supported.

### Milestone 3 — Settlement observability and Circle Contracts

Add contract deployment and monitoring workflows using Circle Contracts where applicable. Index key escrow events and create a public settlement history dashboard that shows deposits, milestone submissions, and USDC releases.

### Milestone 4 — Gateway cross-chain funding

Prototype Circle Gateway-powered funding so clients can fund Arc escrow contracts from USDC balances across supported chains. This will make Arc the settlement layer even when client liquidity starts elsewhere.

### Milestone 5 — Pilot and marketplace integration

Run a controlled pilot with creator/freelance/casting workflows, gather transaction data, and package the escrow flow as an integration layer for marketplaces.

## Project Traction and Roadmap

### Current traction and success achieved

Current status: MVP codebase completed locally and prepared for Arc Testnet deployment. The next step is to deploy the factory contract, generate test transactions, and publish the repository and demo.

Target testnet metrics before final submission:

- 1 public web demo
- 1 public GitHub repository
- 1 deployed EscrowFactory contract on Arc Testnet
- 10+ milestone escrow contracts created
- 30+ USDC approve/deposit/release transactions
- 1 public architecture and technical roadmap
- 1 five-minute product and code walkthrough video

### Technical Roadmap: Timeline and grant milestones

The technical roadmap moves from a working Arc Testnet MVP to Circle wallet onboarding, Circle Contracts deployment and monitoring, Gateway-based cross-chain funding, and eventually mainnet pilot readiness.

Grant funding will be used to accelerate smart contract development, Circle integration, frontend polish, transaction monitoring, security review, demo production, and pilot user validation.

### How will this grant support your technical roadmap?

The grant will directly support the transition from a functional MVP into a credible Arc ecosystem product. Specifically, it will fund engineering time for Circle Wallets and Gateway integration, smart contract testing, product UX improvements, deployment infrastructure, analytics dashboards, documentation, and a creator/freelancer pilot program.

The requested support will also help move the project from a single use-case demo into reusable settlement infrastructure that other marketplaces can integrate.

## Conflict of Interest

No known conflict of interest.
