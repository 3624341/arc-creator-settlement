# Reviewer Demo Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual, wallet-free `/demo` experience that explains the Creator Settlement lifecycle and verifies a real Arc Testnet milestone payment onchain.

**Architecture:** A server-rendered route combines immutable bilingual walkthrough copy with the existing strict Arc receipt verifier. Pure presentational components render recorded steps separately from the verified payment result inside a public shell that contains no wallet code. Dependency injection at the view-model boundary makes success and failure states deterministic in tests.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, Tailwind CSS, viem, Node test runner, React server rendering

**Spec:** `docs/superpowers/specs/2026-09-12-reviewer-demo-mode-design.md`

## Global Constraints

- `/demo` must not access an injected wallet provider, restore a wallet session, request accounts or signatures, add networks, or submit transactions.
- English is the default; Korean is selected only with `?lang=ko` and selection remains shareable without browser storage.
- Recorded offchain steps must never be labeled verified.
- Payment success may be displayed only after `loadSettlementReceipt()` verifies the Arc Testnet transaction and escrow state.
- Supabase, localStorage, screenshots, and curated metadata are not payment proof.
- RPC and verification failures must remain distinct from payment failure and must never produce a success badge.
- Cross-chain funding remains a separately labeled testnet engineering extension with no actionable bridge controls.
- No smart-contract, escrow lifecycle, marketplace, passport, archive, favorite, or cross-chain execution behavior changes are in scope.
- Existing modified TypeChain files and untracked `tsconfig.tsbuildinfo` must remain uncommitted and untouched.

---

## File structure

- Create `lib/reviewer-demo.ts`: locale parsing, immutable bilingual copy, reviewed receipt hash, explicit verification result types, and dependency-injected view-model loader.
- Create `components/PublicDemoShell.tsx`: wallet-free public header, navigation, language controls, and footer links.
- Create `components/ReviewerDemo.tsx`: pure walkthrough and evidence presentation.
- Create `app/demo/page.tsx`: server route that resolves locale, loads the view model, and renders the public experience.
- Create `web-test/reviewer-demo-model.test.ts`: locale, step, verified-result, and error-result unit tests.
- Create `web-test/reviewer-demo-ui.test.tsx`: static-render assertions for trust labels, bilingual output, links, and absence of wallet controls.
- Modify `app/page.tsx`: add the primary reviewer-demo call to action.
- Modify `components/Shell.tsx`: add a `Reviewer Demo` navigation link to the existing application shell.
- Modify `web-test/public-demo.test.tsx`: assert the new route entry points and wallet-isolation source boundary.
- Modify `README.md`: add the reviewer demo to public verification links and describe its trust boundary.

---

### Task 1: Reviewer demo view model

**Files:**
- Create: `lib/reviewer-demo.ts`
- Create: `web-test/reviewer-demo-model.test.ts`

**Interfaces:**
- Consumes: `loadSettlementReceipt(txHash: string): Promise<SettlementReceipt>` and `ReceiptError` from `lib/receipts`.
- Produces: `DemoLocale`, `ReviewerDemoCopy`, `ReviewerDemoVerification`, `ReviewerDemoView`, `resolveDemoLocale()`, `getReviewerDemoCopy()`, and `loadReviewerDemo()`.

- [ ] **Step 1: Write failing locale and narrative tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getReviewerDemoCopy,
  resolveDemoLocale
} from "../lib/reviewer-demo";

test("reviewer demo defaults to English and accepts only Korean explicitly", () => {
  assert.equal(resolveDemoLocale(undefined), "en");
  assert.equal(resolveDemoLocale("ko"), "ko");
  assert.equal(resolveDemoLocale("en"), "en");
  assert.equal(resolveDemoLocale("ja"), "en");
  assert.equal(resolveDemoLocale(["ko", "en"]), "ko");
});

test("both locales describe six recorded settlement stages", () => {
  for (const locale of ["en", "ko"] as const) {
    const copy = getReviewerDemoCopy(locale);
    assert.equal(copy.steps.length, 6);
    assert.deepEqual(copy.steps.map((step) => step.number), [1, 2, 3, 4, 5, 6]);
    assert.ok(copy.steps.every((step) => step.kind === "recorded" || step.number === 6));
    assert.match(copy.testnetNotice, /testnet|테스트넷/i);
  }
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm.cmd run test:web -- web-test/reviewer-demo-model.test.ts`

Expected: FAIL because `lib/reviewer-demo.ts` does not exist.

- [ ] **Step 3: Implement locale, copy, and explicit result types**

Create the following public shape and use the exact English and Korean copy shown below:

```ts
import { loadSettlementReceipt } from "./receipts/chain";
import { ReceiptError, type ReceiptErrorCode, type SettlementReceipt } from "./receipts/types";

export const REVIEWER_DEMO_RECEIPT_TX_HASH =
  "0xe491bc671416c252f991056b13bc8253511297ca532619bf54321c76d259f928";

export type DemoLocale = "en" | "ko";
export type ReviewerDemoStep = {
  number: number;
  kind: "recorded" | "onchain";
  title: string;
  body: string;
};
export type ReviewerDemoCopy = {
  eyebrow: string;
  title: string;
  introduction: string;
  readOnlyLabel: string;
  noWalletLabel: string;
  recordedLabel: string;
  verifiedLabel: string;
  unavailableLabel: string;
  verificationHeading: string;
  detailsLabel: string;
  receiptLabel: string;
  explorerLabel: string;
  crossChainEyebrow: string;
  crossChainTitle: string;
  crossChainBody: string;
  resourcesTitle: string;
  testnetNotice: string;
  steps: readonly ReviewerDemoStep[];
};
export type ReviewerDemoVerification =
  | { status: "verified"; receipt: SettlementReceipt }
  | { status: "unavailable"; code: ReceiptErrorCode };
export type ReviewerDemoView = {
  locale: DemoLocale;
  copy: ReviewerDemoCopy;
  verification: ReviewerDemoVerification;
};

export function resolveDemoLocale(value?: string | string[]): DemoLocale {
  const requested = Array.isArray(value) ? value[0] : value;
  return requested === "ko" ? "ko" : "en";
}

const COPY: Record<DemoLocale, ReviewerDemoCopy> = {
  en: {
    eyebrow: "Recorded Arc Testnet Demo",
    title: "See a creator agreement settle in 90 seconds.",
    introduction: "Follow the advertiser and creator journey without connecting a wallet. Recorded product steps are separated from payment evidence verified directly on Arc Testnet.",
    readOnlyLabel: "Read only",
    noWalletLabel: "No wallet required",
    recordedLabel: "Recorded product step",
    verifiedLabel: "Verified on Arc Testnet",
    unavailableLabel: "Verification unavailable",
    verificationHeading: "Independent payment evidence",
    detailsLabel: "View full onchain details",
    receiptLabel: "Public receipt",
    explorerLabel: "View on ArcScan",
    crossChainEyebrow: "Testnet engineering extension",
    crossChainTitle: "Bring USDC from Base Sepolia to Arc Testnet",
    crossChainBody: "A separate testnet prototype funds the advertiser wallet through Circle App Kit before the normal Arc escrow deposit. No bridge or wallet action runs on this reviewer page.",
    resourcesTitle: "Inspect the product and implementation",
    testnetNotice: "Testnet demonstration only. Test assets have no monetary value and this page makes no mainnet or production-usage claim.",
    steps: [
      { number: 1, kind: "recorded", title: "Create the agreement", body: "The advertiser defines the project, creator requirements, USDC budget, and milestone deliverables." },
      { number: 2, kind: "recorded", title: "Apply with Creator Passport", body: "Demo Creator submits a wallet-signed profile with skills, languages, portfolio links, and work preferences." },
      { number: 3, kind: "recorded", title: "Review and select", body: "The advertiser reviews the application and assigns the selected creator to the escrow." },
      { number: 4, kind: "recorded", title: "Fund USDC escrow", body: "The advertiser approves the exact funding amount and deposits test USDC into the Arc escrow." },
      { number: 5, kind: "recorded", title: "Submit milestone work", body: "The selected creator submits completed work for advertiser review." },
      { number: 6, kind: "onchain", title: "Release and verify payment", body: "The advertiser releases the approved milestone. The result below is accepted only after the transaction and escrow state agree on Arc." }
    ]
  },
  ko: {
    eyebrow: "기록된 Arc 테스트넷 데모",
    title: "90초 안에 크리에이터 계약의 정산 과정을 확인하세요.",
    introduction: "지갑 연결 없이 광고주와 크리에이터의 흐름을 볼 수 있습니다. 기록된 제품 단계와 Arc 테스트넷에서 직접 검증한 지급 증거를 구분합니다.",
    readOnlyLabel: "읽기 전용",
    noWalletLabel: "지갑 연결 불필요",
    recordedLabel: "기록된 제품 단계",
    verifiedLabel: "Arc 테스트넷 검증 완료",
    unavailableLabel: "검증 일시 중단",
    verificationHeading: "독립적으로 검증된 지급 증거",
    detailsLabel: "전체 온체인 정보 보기",
    receiptLabel: "공개 영수증",
    explorerLabel: "ArcScan에서 보기",
    crossChainEyebrow: "테스트넷 기술 확장",
    crossChainTitle: "Base Sepolia의 USDC를 Arc 테스트넷으로 가져오기",
    crossChainBody: "별도의 테스트넷 프로토타입이 Circle App Kit을 통해 광고주 지갑을 충전한 뒤 기존 Arc escrow 예치를 실행합니다. 이 리뷰 페이지에서는 브리지나 지갑 요청을 실행하지 않습니다.",
    resourcesTitle: "제품과 구현 확인하기",
    testnetNotice: "테스트넷 데모입니다. 테스트 자산은 금전적 가치가 없으며 메인넷 또는 실제 운영 실적을 주장하지 않습니다.",
    steps: [
      { number: 1, kind: "recorded", title: "계약 생성", body: "광고주가 프로젝트, 크리에이터 조건, USDC 예산과 마일스톤 결과물을 정의합니다." },
      { number: 2, kind: "recorded", title: "Creator Passport로 지원", body: "Demo Creator가 기술, 언어, 포트폴리오와 업무 조건이 담긴 지갑 서명 프로필로 지원합니다." },
      { number: 3, kind: "recorded", title: "지원자 검토 및 선택", body: "광고주가 지원서를 확인하고 선택한 크리에이터를 escrow에 지정합니다." },
      { number: 4, kind: "recorded", title: "USDC escrow 예치", body: "광고주가 정확한 예치 금액을 승인하고 Arc escrow에 테스트 USDC를 입금합니다." },
      { number: 5, kind: "recorded", title: "마일스톤 제출", body: "선택된 크리에이터가 완료한 작업을 광고주 검토용으로 제출합니다." },
      { number: 6, kind: "onchain", title: "지급 및 검증", body: "광고주가 승인한 마일스톤을 지급합니다. 아래 결과는 Arc의 거래 이벤트와 escrow 상태가 일치할 때만 검증 완료로 표시됩니다." }
    ]
  }
};

export function getReviewerDemoCopy(locale: DemoLocale): ReviewerDemoCopy {
  return COPY[locale];
}

export async function loadReviewerDemo(
  locale: DemoLocale,
  dependencies: {
    loadReceipt?: typeof loadSettlementReceipt;
    txHash?: string;
  } = {}
): Promise<ReviewerDemoView> {
  try {
    const receipt = await (dependencies.loadReceipt ?? loadSettlementReceipt)(
      dependencies.txHash ?? REVIEWER_DEMO_RECEIPT_TX_HASH
    );
    return { locale, copy: getReviewerDemoCopy(locale), verification: { status: "verified", receipt } };
  } catch (error) {
    const code: ReceiptErrorCode = error instanceof ReceiptError ? error.code : "RPC_UNAVAILABLE";
    return { locale, copy: getReviewerDemoCopy(locale), verification: { status: "unavailable", code } };
  }
}
```

The sixth narrative step remains `kind: "onchain"`; its badge is determined only from `verification.status`, never from this static field.

- [ ] **Step 4: Add failing verification-state tests**

```ts
test("verified state contains only the receipt returned by the chain verifier", async () => {
  const receipt = makeReceipt();
  const view = await loadReviewerDemo("en", { loadReceipt: async () => receipt });
  assert.equal(view.verification.status, "verified");
  if (view.verification.status === "verified") assert.equal(view.verification.receipt, receipt);
});

test("verification errors never become successful demo evidence", async () => {
  for (const code of ["TRANSACTION_NOT_FOUND", "TRANSACTION_REVERTED", "PAYMENT_EVENT_NOT_FOUND", "CONTRACT_STATE_MISMATCH", "RPC_UNAVAILABLE"] as const) {
    const view = await loadReviewerDemo("en", {
      loadReceipt: async () => { throw new ReceiptError(code); }
    });
    assert.deepEqual(view.verification, { status: "unavailable", code });
  }
});
```

Define `makeReceipt()` in the test with a complete `SettlementReceipt` matching the existing receipt tests.

- [ ] **Step 5: Run model tests and confirm they pass**

Run: `npm.cmd run test:web -- web-test/reviewer-demo-model.test.ts`

Expected: all reviewer demo model tests PASS.

- [ ] **Step 6: Commit the model**

```bash
git add lib/reviewer-demo.ts web-test/reviewer-demo-model.test.ts
git commit -m "feat: add reviewer demo evidence model"
```

---

### Task 2: Wallet-free reviewer presentation

**Files:**
- Create: `components/PublicDemoShell.tsx`
- Create: `components/ReviewerDemo.tsx`
- Create: `web-test/reviewer-demo-ui.test.tsx`

**Interfaces:**
- Consumes: `DemoLocale`, `ReviewerDemoView`, and `receiptErrorView()`.
- Produces: `PublicDemoShell({ locale, children })` and `ReviewerDemo({ view })` React components.

- [ ] **Step 1: Write failing static-render tests**

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicDemoShell } from "../components/PublicDemoShell";
import { ReviewerDemo } from "../components/ReviewerDemo";
import { getReviewerDemoCopy, type ReviewerDemoView } from "../lib/reviewer-demo";

test("public demo shell exposes language and evidence links without wallet controls", () => {
  const html = renderToStaticMarkup(<PublicDemoShell locale="en"><p>demo</p></PublicDemoShell>);
  assert.match(html, /href="\/demo"/);
  assert.match(html, /href="\/demo\?lang=ko"/);
  assert.match(html, /GitHub/);
  assert.doesNotMatch(html, /Connect Wallet|Connect browser wallet|wallet_addEthereumChain/);
});

test("reviewer demo distinguishes recorded stages from verified Arc evidence", () => {
  const view: ReviewerDemoView = {
    locale: "en",
    copy: getReviewerDemoCopy("en"),
    verification: { status: "verified", receipt: makeReceipt() }
  };
  const html = renderToStaticMarkup(<ReviewerDemo view={view} />);
  assert.match(html, /Recorded product step/);
  assert.match(html, /Verified on Arc Testnet/);
  assert.match(html, /Public receipt/);
  assert.match(html, /ArcScan/);
  assert.match(html, /Testnet engineering extension/);
  assert.doesNotMatch(html, /Bridge to Arc/);
});
```

Add Korean and unavailable-state cases. The Korean case must contain `지갑 연결 불필요`; the unavailable case must contain the mapped error title and must not contain `Verified on Arc Testnet`.

- [ ] **Step 2: Run the UI test and confirm it fails**

Run: `npm.cmd run test:web -- web-test/reviewer-demo-ui.test.tsx`

Expected: FAIL because both components do not exist.

- [ ] **Step 3: Implement the public shell**

`PublicDemoShell` must be a server-compatible component with no `"use client"` directive and no import from wallet, Circle session, feature-flag, or marketplace modules. Include:

- Product logo linking to `/`.
- `Product`, `Reviewer Demo`, `Security`, and `GitHub` navigation.
- English link `/demo` and Korean link `/demo?lang=ko` with `aria-current` on the active locale.
- A footer that states the page is read-only and uses Arc Testnet evidence.

Implement the component with this structure, adjusting only Tailwind layout classes during browser polish:

```tsx
import Link from "next/link";
import type { DemoLocale } from "@/lib/reviewer-demo";

export function PublicDemoShell({ locale, children }: { locale: DemoLocale; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-5 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-arc-line bg-white/80 px-5 py-4 shadow-sm">
        <Link href="/" className="flex items-center gap-3 font-black"><span className="grid h-10 w-10 place-items-center rounded-full bg-arc-ink text-white">A</span>Arc Creator Settlement</Link>
        <nav aria-label="Reviewer demo navigation" className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <Link href="/">Product</Link><Link href="/demo">Reviewer Demo</Link><Link href="/security">Security</Link>
          <a href="https://github.com/3624341/arc-creator-settlement" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </nav>
        <nav aria-label="Language" className="flex rounded-full border border-arc-line bg-white p-1 text-sm font-black">
          <Link href="/demo" aria-current={locale === "en" ? "page" : undefined} className={locale === "en" ? "rounded-full bg-arc-ink px-3 py-2 text-white" : "px-3 py-2"}>English</Link>
          <Link href="/demo?lang=ko" aria-current={locale === "ko" ? "page" : undefined} className={locale === "ko" ? "rounded-full bg-arc-ink px-3 py-2 text-white" : "px-3 py-2"}>한국어</Link>
        </nav>
      </header>
      {children}
      <footer className="mt-10 border-t border-arc-line py-6 text-sm text-arc-muted">Read-only Arc Testnet evidence · No wallet required</footer>
    </main>
  );
}
```

- [ ] **Step 4: Implement the walkthrough component**

Render:

- A hero with `Recorded Arc Testnet Demo`, `Read only`, and `No wallet required` badges.
- An ordered list of six stages.
- Steps 1-5 with the localized recorded label.
- Step 6 with either a verified receipt card or a localized unavailable panel using `receiptErrorView(view.verification.code)`.
- A native `<details>` evidence disclosure containing full public addresses and block data.
- External links with `target="_blank"` and `rel="noopener noreferrer"`.
- A cross-chain note with no button and no success claim.
- Resource cards for the repository, Korean guide, Builder Hub, and security page.

Use these stable resources:

```ts
const resources = {
  github: "https://github.com/3624341/arc-creator-settlement",
  koreanGuide: "https://github.com/3624341/arc-korean-build-guide",
  builderHub: "https://arc-builder-hub-theta.vercel.app/",
  security: "/security"
};
```

The public receipt URL is `/receipt/${receipt.txHash}` and ArcScan comes only from `receipt.explorerUrl`.

Use an explicit status branch rather than deriving verification from the sixth step:

```tsx
import Link from "next/link";
import { receiptErrorView, shortAddress } from "@/lib/receipts/presentation";
import type { ReviewerDemoView } from "@/lib/reviewer-demo";

export function ReviewerDemo({ view }: { view: ReviewerDemoView }) {
  const { copy, verification } = view;
  return (
    <article className="py-8 sm:py-12">
      <section className="rounded-[2.5rem] bg-arc-ink p-7 text-white sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-arc-cyan">{copy.eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{copy.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{copy.introduction}</p>
        <div className="mt-6 flex flex-wrap gap-2"><span>{copy.readOnlyLabel}</span><span>{copy.noWalletLabel}</span></div>
      </section>

      <ol className="mt-8 grid gap-5">
        {copy.steps.map((step) => (
          <li key={step.number} className="rounded-[2rem] border border-arc-line bg-white/80 p-6">
            <p className="text-xs font-black uppercase tracking-wider text-arc-purple">{step.number < 6 ? copy.recordedLabel : copy.verificationHeading}</p>
            <h2 className="mt-2 text-2xl font-black">{step.number}. {step.title}</h2>
            <p className="mt-2 leading-7 text-arc-muted">{step.body}</p>
            {step.number === 6 ? verification.status === "verified" ? (
              <section aria-label={copy.verifiedLabel} className="mt-5 rounded-2xl bg-arc-ink p-5 text-white">
                <p className="font-black text-arc-lime">{copy.verifiedLabel}</p>
                <p className="mt-3 text-3xl font-black">{verification.receipt.amountUsdc} USDC</p>
                <p className="mt-1 text-white/70">{verification.receipt.projectTitle} · {verification.receipt.milestoneDescription}</p>
                <details className="mt-4"><summary className="cursor-pointer font-bold">{copy.detailsLabel}</summary><dl className="mt-3 grid gap-2 text-sm"><dt>Recipient</dt><dd title={verification.receipt.creatorAddress}>{shortAddress(verification.receipt.creatorAddress)}</dd><dt>Block</dt><dd>{verification.receipt.blockNumber}</dd><dt>Escrow</dt><dd title={verification.receipt.escrowAddress}>{shortAddress(verification.receipt.escrowAddress)}</dd></dl></details>
                <div className="mt-5 flex flex-wrap gap-3"><Link href={`/receipt/${verification.receipt.txHash}`}>{copy.receiptLabel}</Link><a href={verification.receipt.explorerUrl} target="_blank" rel="noopener noreferrer">{copy.explorerLabel}</a></div>
              </section>
            ) : (() => { const error = receiptErrorView(verification.code); return <section role="status" className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5"><p className="font-black">{copy.unavailableLabel}</p><h3 className="mt-2 text-xl font-black">{error.title}</h3><p className="mt-2 text-arc-muted">{error.body}</p><Link href={view.locale === "ko" ? "/demo?lang=ko" : "/demo"} className="mt-4 inline-block font-black">Try again</Link></section>; })() : null}
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-[2rem] border border-arc-purple/30 bg-purple-50 p-6"><p className="text-xs font-black uppercase tracking-wider text-arc-purple">{copy.crossChainEyebrow}</p><h2 className="mt-2 text-2xl font-black">{copy.crossChainTitle}</h2><p className="mt-3 leading-7 text-arc-muted">{copy.crossChainBody}</p></section>
      <section className="mt-8"><h2 className="text-3xl font-black">{copy.resourcesTitle}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><a href={resources.github}>GitHub repository</a><a href={resources.koreanGuide}>Korean Arc build guide</a><a href={resources.builderHub}>Arc Builder Hub</a><Link href={resources.security}>Security disclosure</Link></div></section>
      <p className="mt-8 rounded-2xl bg-white/70 p-4 text-sm leading-6 text-arc-muted">{copy.testnetNotice}</p>
    </article>
  );
}
```

Move the `resources` constant into the same module above the component and add `target="_blank" rel="noopener noreferrer"` to all external resource anchors in the final implementation.

- [ ] **Step 5: Run UI tests and confirm they pass**

Run: `npm.cmd run test:web -- web-test/reviewer-demo-ui.test.tsx`

Expected: all reviewer demo UI tests PASS.

- [ ] **Step 6: Commit the presentation**

```bash
git add components/PublicDemoShell.tsx components/ReviewerDemo.tsx web-test/reviewer-demo-ui.test.tsx
git commit -m "feat: add wallet-free reviewer walkthrough"
```

---

### Task 3: Demo route and application entry points

**Files:**
- Create: `app/demo/page.tsx`
- Modify: `app/page.tsx`
- Modify: `components/Shell.tsx`
- Modify: `web-test/public-demo.test.tsx`

**Interfaces:**
- Consumes: `resolveDemoLocale()`, `loadReviewerDemo()`, `PublicDemoShell`, and `ReviewerDemo`.
- Produces: public `/demo` and `/demo?lang=ko` routes plus home and navigation entry points.

- [ ] **Step 1: Add failing route and source-boundary tests**

Extend `web-test/public-demo.test.tsx` with:

```ts
test("reviewer demo has public entry points and an isolated route", () => {
  const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/Shell.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/demo/page.tsx", import.meta.url), "utf8");
  const publicShell = readFileSync(new URL("../components/PublicDemoShell.tsx", import.meta.url), "utf8");

  assert.match(home, /href="\/demo"/);
  assert.match(home, /View 90-second demo/);
  assert.match(shell, /Reviewer Demo/);
  assert.match(route, /loadReviewerDemo/);
  assert.match(route, /PublicDemoShell/);
  assert.doesNotMatch(route, /@\/components\/Shell/);
  assert.doesNotMatch(route + publicShell, /browser-wallet|circle-wallet-client|eth_accounts|personal_sign|wallet_addEthereumChain/);
});
```

- [ ] **Step 2: Run the public demo test and confirm it fails**

Run: `npm.cmd run test:web -- web-test/public-demo.test.tsx`

Expected: FAIL because `app/demo/page.tsx` and the entry points do not exist.

- [ ] **Step 3: Implement the server route**

```tsx
import type { Metadata } from "next";
import { PublicDemoShell } from "@/components/PublicDemoShell";
import { ReviewerDemo } from "@/components/ReviewerDemo";
import { loadReviewerDemo, resolveDemoLocale } from "@/lib/reviewer-demo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "90-second reviewer demo · Arc Creator Settlement",
  description: "A wallet-free, read-only walkthrough with verified Arc Testnet payment evidence."
};

type DemoPageProps = {
  searchParams: Promise<{ lang?: string | string[] }>;
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const locale = resolveDemoLocale((await searchParams).lang);
  const view = await loadReviewerDemo(locale);
  return <PublicDemoShell locale={locale}><ReviewerDemo view={view} /></PublicDemoShell>;
}
```

- [ ] **Step 4: Add home and shell links**

Add a high-visibility home hero link:

```tsx
<Link href="/demo" className="inline-flex items-center gap-2 rounded-full bg-arc-lime px-6 py-4 font-black text-arc-ink shadow-sm">
  View 90-second demo <ArrowRight size={18} aria-hidden="true" />
</Link>
```

Add `{ href: "/demo", label: "Reviewer Demo" }` to the `navigation` array in `components/Shell.tsx`. Do not alter wallet restoration or connection behavior for existing interactive routes.

- [ ] **Step 5: Run route and all focused tests**

Run: `npm.cmd run test:web -- web-test/public-demo.test.tsx web-test/reviewer-demo-model.test.ts web-test/reviewer-demo-ui.test.tsx`

Expected: all focused tests PASS.

- [ ] **Step 6: Commit the route and entry points**

```bash
git add app/demo/page.tsx app/page.tsx components/Shell.tsx web-test/public-demo.test.tsx
git commit -m "feat: publish reviewer demo route"
```

---

### Task 4: Public documentation

**Files:**
- Modify: `README.md`
- Test: `web-test/public-demo.test.tsx`

**Interfaces:**
- Consumes: the completed `/demo` behavior and stable evidence URLs.
- Produces: reviewer-facing repository documentation that states the same trust boundary as the UI.

- [ ] **Step 1: Add failing documentation assertions**

```ts
test("README documents the reviewer demo trust boundary", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /Reviewer Demo Mode/);
  assert.match(readme, /no wallet/i);
  assert.match(readme, /recorded.*verified|verified.*recorded/is);
  assert.match(readme, /\/demo/);
});
```

- [ ] **Step 2: Run the documentation test and confirm it fails**

Run: `npm.cmd run test:web -- web-test/public-demo.test.tsx`

Expected: FAIL because the README does not describe Reviewer Demo Mode.

- [ ] **Step 3: Document the feature accurately**

Add a `Reviewer Demo Mode` section to `README.md` stating:

- `/demo` is read-only and requires no wallet.
- Steps 1-5 are recorded product narrative.
- Payment release is independently re-verified from Arc RPC and escrow state.
- Verification outage does not imply transaction failure.
- The page makes no mainnet, traction, or production-usage claim.

Also add `/demo` to `Live verification` with a relative URL until a deployment URL is verified.

Use this exact documentation text and update it only if browser verification reveals a factual mismatch:

```markdown
## Reviewer Demo Mode

Open `/demo` for an English-first, read-only walkthrough that requires no wallet connection. Use `/demo?lang=ko` for Korean.

The contract creation, application, selection, funding, and submission cards are recorded product narrative. They explain the shipped workflow but are not presented as independent proof. The payment release card is marked verified only after the server reconstructs and validates the confirmed `PaymentReleased` event and matching escrow state through Arc RPC.

If Arc RPC is temporarily unavailable, the page keeps the walkthrough visible and marks verification unavailable; it does not describe the payment as failed or verified. Reviewer Demo Mode makes no mainnet, traction, or production-usage claim.
```

- [ ] **Step 4: Run the documentation test and confirm it passes**

Run: `npm.cmd run test:web -- web-test/public-demo.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md web-test/public-demo.test.tsx
git commit -m "docs: explain reviewer demo trust boundary"
```

---

### Task 5: Full verification and browser review

**Files:**
- Verify only; do not commit generated artifacts.

**Interfaces:**
- Consumes: the complete Reviewer Demo Mode implementation.
- Produces: test, build, browser, accessibility, and wallet-isolation evidence for handoff.

- [ ] **Step 1: Run all web tests**

Run: `npm.cmd run test:web`

Expected: all web tests PASS with no new failures.

- [ ] **Step 2: Run contract tests**

Run: `npm.cmd test`

Expected: all existing Hardhat tests PASS. Any generated TypeChain changes remain outside the feature commits.

- [ ] **Step 3: Run the production build**

Run: `npm.cmd run build`

Expected: build exits successfully and lists `/demo` as a generated route. The existing multiple-lockfile warning may remain but no new build error is accepted.

- [ ] **Step 4: Start a local production-equivalent preview**

Run: `npm.cmd run dev -- --port 3011`

Expected: Next.js reports ready at `http://localhost:3011`.

- [ ] **Step 5: Verify English desktop behavior**

Open `http://localhost:3011/demo` in a clean browser context and confirm:

- English is active.
- Six steps are visible in order.
- Recorded and verified labels are visually distinct.
- No wallet popup appears and the console contains no wallet-provider request or runtime error.
- Public receipt and ArcScan links match the verified receipt.

- [ ] **Step 6: Verify Korean and mobile behavior**

Open `http://localhost:3011/demo?lang=ko` at a mobile viewport and confirm:

- Korean copy is active and the URL remains shareable.
- Cards do not overflow horizontally.
- Evidence details and links are keyboard accessible.
- No wallet popup appears.

- [ ] **Step 7: Inspect the final diff and repository status**

Run: `git diff --check`

Run: `git status --short`

Expected: no whitespace errors; only intentional feature changes plus the pre-existing modified TypeChain files and untracked `tsconfig.tsbuildinfo` remain.

- [ ] **Step 8: Commit any verification-only corrections**

If browser verification required a scoped correction, rerun the focused and full checks, then commit only the intentional source and test files:

```bash
git add app/demo/page.tsx app/page.tsx components/PublicDemoShell.tsx components/ReviewerDemo.tsx components/Shell.tsx lib/reviewer-demo.ts web-test/reviewer-demo-model.test.ts web-test/reviewer-demo-ui.test.tsx web-test/public-demo.test.tsx README.md
git commit -m "fix: polish reviewer demo verification"
```

If no correction was needed, do not create an empty commit.

---

## Delivery checkpoint

After all checks pass, report:

- Reviewer Demo Mode behavior and trust boundaries.
- Focused, full web, contract, and production-build results.
- Browser verification results for English desktop and Korean mobile views.
- Branch and commit list.
- Remaining pre-existing generated-file changes.
- Whether deployment, push, merge, or production promotion has not yet been performed.
