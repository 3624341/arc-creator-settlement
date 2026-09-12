import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicDemoShell } from "../components/PublicDemoShell";
import { ReviewerDemo } from "../components/ReviewerDemo";
import { getReviewerDemoCopy, type ReviewerDemoView } from "../lib/reviewer-demo";
import type { SettlementReceipt } from "../lib/receipts/types";

function makeReceipt(): SettlementReceipt {
  return {
    txHash: `0x${"a".repeat(64)}`,
    status: "confirmed",
    chainId: 5042002,
    blockNumber: "9999",
    confirmedAt: "2026-09-01T00:00:00.000Z",
    escrowAddress: "0x1000000000000000000000000000000000000000",
    clientAddress: "0x3000000000000000000000000000000000000000",
    creatorAddress: "0x2000000000000000000000000000000000000000",
    milestoneIndex: 2,
    milestoneDescription: "Content published",
    amountUsdc: "425",
    projectTitle: "Tokyo Skincare Campaign",
    explorerUrl: `https://testnet.arcscan.app/tx/0x${"a".repeat(64)}`
  };
}

test("public demo shell exposes language and evidence links without wallet controls", () => {
  const html = renderToStaticMarkup(
    <PublicDemoShell locale="en"><p>demo</p></PublicDemoShell>
  );

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
  assert.equal((html.match(/Recorded product step<\/p>/g) ?? []).length, 5);
  assert.match(html, /dateTime="2026-09-01T00:00:00.000Z"/);
  assert.match(html, />0x2000000000000000000000000000000000000000<\/dd>/);
  assert.match(html, />0x3000000000000000000000000000000000000000<\/dd>/);
  assert.match(html, />0x1000000000000000000000000000000000000000<\/dd>/);
});

test("Korean reviewer demo clearly states that no wallet connection is required", () => {
  const view: ReviewerDemoView = {
    locale: "ko",
    copy: getReviewerDemoCopy("ko"),
    verification: { status: "verified", receipt: makeReceipt() }
  };
  const html = renderToStaticMarkup(
    <PublicDemoShell locale="ko"><ReviewerDemo view={view} /></PublicDemoShell>
  );

  assert.match(html, /지갑 연결 불필요/);
  assert.match(html, /Arc 테스트넷 검증 완료/);
  assert.match(html, /lang="ko"/);
  assert.match(html, /소스 코드, 컨트랙트, 테스트와 구현 이력을 확인하세요/);
});

test("unavailable verification renders safe guidance without a verified badge", () => {
  const view: ReviewerDemoView = {
    locale: "en",
    copy: getReviewerDemoCopy("en"),
    verification: { status: "unavailable", code: "RPC_UNAVAILABLE" }
  };
  const html = renderToStaticMarkup(<ReviewerDemo view={view} />);

  assert.match(html, /Arc is temporarily unavailable/);
  assert.match(html, /Verification unavailable/);
  assert.doesNotMatch(html, /Verified on Arc Testnet/);
});

test("Korean verification outage guidance is localized", () => {
  const view: ReviewerDemoView = {
    locale: "ko",
    copy: getReviewerDemoCopy("ko"),
    verification: { status: "unavailable", code: "RPC_UNAVAILABLE" }
  };
  const html = renderToStaticMarkup(<ReviewerDemo view={view} />);

  assert.match(html, /Arc 연결이 일시적으로 원활하지 않습니다/);
  assert.doesNotMatch(html, /Arc is temporarily unavailable/);
});
