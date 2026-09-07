import React from "react";
import { CopyAddress } from "./copy-address";

const product = "https://arc-creator-settlement-v0-2.vercel.app";
const repo = "https://github.com/3624341/arc-creator-settlement";
const guide = "https://github.com/3624341/arc-korean-build-guide";
const transaction = "0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856";
const escrow = "0x22De463e9969b8Cef07b151b9cB5D8c5A16D81Df";
const factory = "0x5b90cdfecf1c59596e0b6b9cae448a29c2774e32";

function External({ href, children, className = "text-link" }: { href: string; children: React.ReactNode; className?: string }) {
  return <a href={href} className={className} target="_blank" rel="noreferrer">{children}<span className="arrow" aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>;
}

const implementation = [
  { name: "Product & wallet experience", tech: "Next.js · TypeScript · viem", detail: "Contract creation, wallet selection, and milestone actions.", href: `${repo}/tree/main/app`, label: "Application source" },
  { name: "Milestone escrow", tech: "Solidity · Arc Testnet", detail: "USDC funding, submitted work, and client-approved releases.", href: `${repo}/tree/main/contracts`, label: "Smart contracts" },
  { name: "User-controlled authorization", tech: "Circle Wallets", detail: "An alternative wallet flow with user approval for contract calls.", href: `${repo}/blob/main/lib/circle-wallet-client.ts`, label: "Wallet integration" },
  { name: "Public payment receipts", tech: "Arc RPC · Transaction events", detail: "Receipt facts reconstructed from a transaction and escrow state.", href: `${repo}/tree/main/lib/receipts`, label: "Verification source" },
];

export default function HomePage() {
  return <main id="main-content">
    <section className="hero" id="projects" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-dot" /> INDEPENDENT BUILDER · ARC TESTNET</p>
        <h1 id="hero-title">USDC milestone<br className="desktop-break" /> payments,<br /><em>built on Arc.</em></h1>
        <p className="hero-lede">A working settlement app. A payment you can verify. A practical guide for the next builder in Korea.</p>
        <div className="actions"><External href={product} className="button button-lime">Open live app</External><a href="#evidence" className="button button-secondary">View settlement evidence <span aria-hidden="true">↓</span></a></div>
        <div className="byline"><span className="avatar" aria-hidden="true">DS</span><div><strong>Dongkyun Seo</strong><span>Builder · Seoul, South Korea</span></div></div>
      </div>
      <figure className="product-preview">
        <div className="preview-bar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>CREATOR SETTLEMENT</span><span className="preview-tag">PRODUCT</span></div>
        <a href="/settlement-receipt.png" className="preview-image-link" aria-label="View full archived Creator Settlement receipt screenshot"><img src="/settlement-receipt.png" width="1031" height="933" alt="Creator Settlement receipt showing a recorded 0.25 USDC milestone payment on Arc Testnet." fetchPriority="high" /></a>
        <figcaption><span><span className="status-dot" /> Actual product capture</span><span>Sep 1, 2026 · Testnet</span></figcaption>
      </figure>
    </section>

    <section className="product-summary" aria-label="Creator Settlement capabilities">
      <div><p className="eyebrow">FEATURED PROJECT</p><h2>Arc Creator Settlement</h2><External href={repo}>Explore the source</External></div>
      <div className="feature"><span className="step">01</span><h3>Define the work</h3><p>Set the creator, USDC budget, and milestone terms.</p></div>
      <div className="feature"><span className="step">02</span><h3>Release by milestone</h3><p>Approve submitted work and release payment from escrow.</p></div>
      <div className="feature"><span className="step">03</span><h3>Verify the payment</h3><p>Open a public receipt linked to its Arc transaction.</p></div>
    </section>

    <section className="section" id="evidence" aria-labelledby="evidence-title">
      <div className="section-heading"><div><p className="eyebrow">01 / ONCHAIN EVIDENCE</p><h2 id="evidence-title">One payment. An open record.</h2></div><p>A recorded testnet settlement, with the receipt and original transaction side by side.</p></div>
      <div className="evidence-card">
        <div className="evidence-main"><span className="badge badge-dark"><span className="status-dot" /> RECORDED TESTNET EXAMPLE</span><p className="amount-label">Released to creator</p><p className="payment-amount">0.25 <span>USDC</span></p><p className="evidence-context">Milestone 1 · Contract accepted</p><p className="muted-light">Arc Creator Receipt Demo</p><External href={`${product}/receipt/${transaction}`} className="button button-lime">Open public receipt</External></div>
        <div className="evidence-detail"><div className="detail-heading"><span className="eyebrow">PAYMENT RECORD</span><span className="badge">Arc Testnet</span></div><dl className="facts"><div><dt>Recorded payment</dt><dd><time dateTime="2026-09-01T12:10:00Z">Sep 1, 2026 · 12:10 UTC</time></dd></div><div><dt>Block</dt><dd className="mono">59,934,707</dd></div><div><dt>Network / chain ID</dt><dd>Arc Testnet <span className="muted">/ 5042002</span></dd></div></dl><External href={`https://testnet.arcscan.app/tx/${transaction}`} className="button button-secondary">View transaction on ArcScan</External><p className="record-note">Historical testnet evidence, not live volume. Open the receipt to check the transaction against Arc.</p></div>
        <details className="technical-details"><summary>Contract & transaction details <span aria-hidden="true">+</span></summary><div className="addresses"><CopyAddress label="Release transaction" value={transaction} /><CopyAddress label="Escrow contract" value={escrow} /><CopyAddress label="Escrow factory" value={factory} /></div><External href={`${repo}/blob/main/docs/progress-update-2026-09-01.md`}>Read the recorded evidence notes</External></details>
      </div>
    </section>

    <section className="guide-section section" id="guide" aria-labelledby="guide-title">
      <div className="guide-cover" aria-hidden="true"><span>THE BUILDER SERIES / 01</span><div>ARC<br /><strong>빌드 가이드</strong><small>From first wallet<br />to first deployment.</small></div><span>KOREAN EDITION <b>↗</b></span></div>
      <div className="guide-copy"><p className="eyebrow">02 / COMMUNITY CONTRIBUTION</p><h2 id="guide-title">Build on Arc,<br /><em>in Korean.</em></h2><p>Implementation notes from building Creator Settlement, organized for Korean-speaking developers taking their first steps on Arc.</p><ul className="guide-topics"><li><span>01</span> Network & wallet setup</li><li><span>02</span> Circle Wallet authorization</li><li><span>03</span> Contract deployment & verification</li></ul><External href={guide} className="button button-dark">Read the Korean guide</External></div>
    </section>

    <section className="section" id="implementation" aria-labelledby="implementation-title"><div className="section-heading"><div><p className="eyebrow">03 / UNDER THE HOOD</p><h2 id="implementation-title">What’s implemented.</h2></div><p>Each integration has a purpose.<br />Each implementation has source to inspect.</p></div><div className="implementation-list">{implementation.map(item => <article className="implementation-row" key={item.name}><div><h3>{item.name}</h3><p className="technology">{item.tech}</p></div><p>{item.detail}</p><div className="implementation-links"><span className="badge badge-success">Implemented</span><External href={item.href}>{item.label}</External></div></article>)}</div><p className="scope-note">Current scope: a testnet application. Created jobs and applications are stored in the browser; shared marketplace data is a next step.</p></section>

    <section className="section" id="updates" aria-labelledby="updates-title"><div className="section-heading"><div><p className="eyebrow">04 / BUILD LOG</p><h2 id="updates-title">Progress, with a paper trail.</h2></div><External href={`${repo}/commits/main/`}>View commit history</External></div><div className="progress-grid"><div className="updates-card"><div className="panel-heading"><h3>Recent updates</h3><span className="badge badge-success">Implemented</span></div><ol className="timeline"><li><time dateTime="2026-09-07">SEP 07, 2026</time><h4>Drafts & wallet workspace</h4><p>Resume contract drafts and associate new jobs with the connected wallet.</p><External href={`${repo}/commit/6ac01ac`}>View change</External></li><li><time dateTime="2026-09-07">SEP 07, 2026</time><h4>Selected-wallet approvals</h4><p>Pass the selected browser wallet to escrow creation and contract actions.</p><External href={`${repo}/commit/f155b1a`}>View change</External></li><li><time dateTime="2026-09-01">SEP 01, 2026</time><h4>Public settlement receipt</h4><p>A recorded 0.25 USDC milestone release, linked to its transaction.</p><External href={`${repo}/blob/main/docs/progress-update-2026-09-01.md`}>View evidence</External></li></ol></div><aside className="next-card"><div className="panel-heading"><h3>What’s next</h3><span className="badge">Planned</span></div><p className="next-intro">The next steps toward a shared, dependable marketplace.</p><ol className="next-list"><li><span>01</span><div><h4>Shared marketplace data</h4><p>Make jobs and applications available across browsers and devices.</p></div></li><li><span>02</span><div><h4>Transaction observability</h4><p>Track confirmation, failures, and retry outcomes in one place.</p></div></li><li><span>03</span><div><h4>Security review & pilot</h4><p>Review contract risks and validate a complete flow with pilot participants.</p></div></li></ol><p className="planned-note">Planned work · no delivery dates committed.</p></aside></div></section>

    <section className="feedback"><div><p className="eyebrow">LET’S MAKE THE NEXT BUILD BETTER</p><h2>Tried the settlement flow?</h2><p>Share a wallet issue, a confusing step, or an idea for the guide.</p></div><External href={`${repo}/issues`} className="button button-dark">Share feedback</External></section>
    <footer><div><a href="#main-content" className="brand">ARC <span>BUILDER HUB</span></a><p>Independent builder project · Built in Seoul</p></div><nav aria-label="Social links"><External href={repo}>GitHub</External><External href="https://x.com/supeemais21">X</External><External href="https://www.linkedin.com/in/dongkyun-seo-97032a1a8/">LinkedIn</External></nav></footer>
  </main>;
}
