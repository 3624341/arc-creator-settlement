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
  retryLabel: string;
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

const COPY: Record<DemoLocale, ReviewerDemoCopy> = {
  en: {
    eyebrow: "Recorded Arc Testnet Demo",
    title: "See a creator agreement settle in 90 seconds.",
    introduction:
      "Follow the advertiser and creator journey without connecting a wallet. Recorded product steps are separated from payment evidence verified directly on Arc Testnet.",
    readOnlyLabel: "Read only",
    noWalletLabel: "No wallet required",
    recordedLabel: "Recorded product step",
    verifiedLabel: "Verified on Arc Testnet",
    unavailableLabel: "Verification unavailable",
    verificationHeading: "Independent payment evidence",
    detailsLabel: "View full onchain details",
    receiptLabel: "Public receipt",
    explorerLabel: "View on ArcScan",
    retryLabel: "Try again",
    crossChainEyebrow: "Testnet engineering extension",
    crossChainTitle: "Bring USDC from Base Sepolia to Arc Testnet",
    crossChainBody:
      "A separate testnet prototype funds the advertiser wallet through Circle App Kit before the normal Arc escrow deposit. No bridge or wallet action runs on this reviewer page.",
    resourcesTitle: "Inspect the product and implementation",
    testnetNotice:
      "Testnet demonstration only. Test assets have no monetary value and this page makes no mainnet or production-usage claim.",
    steps: [
      {
        number: 1,
        kind: "recorded",
        title: "Create the agreement",
        body: "The advertiser defines the project, creator requirements, USDC budget, and milestone deliverables."
      },
      {
        number: 2,
        kind: "recorded",
        title: "Apply with Creator Passport",
        body: "Demo Creator submits a wallet-signed profile with skills, languages, portfolio links, and work preferences."
      },
      {
        number: 3,
        kind: "recorded",
        title: "Review and select",
        body: "The advertiser reviews the application and assigns the selected creator to the escrow."
      },
      {
        number: 4,
        kind: "recorded",
        title: "Fund USDC escrow",
        body: "The advertiser approves the exact funding amount and deposits test USDC into the Arc escrow."
      },
      {
        number: 5,
        kind: "recorded",
        title: "Submit milestone work",
        body: "The selected creator submits completed work for advertiser review."
      },
      {
        number: 6,
        kind: "onchain",
        title: "Release and verify payment",
        body: "The advertiser releases the approved milestone. The result below is accepted only after the transaction and escrow state agree on Arc."
      }
    ]
  },
  ko: {
    eyebrow: "기록된 Arc 테스트넷 데모",
    title: "90초 안에 크리에이터 계약의 정산 과정을 확인하세요.",
    introduction:
      "지갑 연결 없이 광고주와 크리에이터의 흐름을 볼 수 있습니다. 기록된 제품 단계와 Arc 테스트넷에서 직접 검증한 지급 증거를 구분합니다.",
    readOnlyLabel: "읽기 전용",
    noWalletLabel: "지갑 연결 불필요",
    recordedLabel: "기록된 제품 단계",
    verifiedLabel: "Arc 테스트넷 검증 완료",
    unavailableLabel: "검증 일시 중단",
    verificationHeading: "독립적으로 검증된 지급 증거",
    detailsLabel: "전체 온체인 정보 보기",
    receiptLabel: "공개 영수증",
    explorerLabel: "ArcScan에서 보기",
    retryLabel: "다시 확인",
    crossChainEyebrow: "테스트넷 기술 확장",
    crossChainTitle: "Base Sepolia의 USDC를 Arc 테스트넷으로 가져오기",
    crossChainBody:
      "별도의 테스트넷 프로토타입이 Circle App Kit을 통해 광고주 지갑을 충전한 뒤 기존 Arc escrow 예치를 실행합니다. 이 리뷰 페이지에서는 브리지나 지갑 요청을 실행하지 않습니다.",
    resourcesTitle: "제품과 구현 확인하기",
    testnetNotice:
      "테스트넷 데모입니다. 테스트 자산은 금전적 가치가 없으며 메인넷 또는 실제 운영 실적을 주장하지 않습니다.",
    steps: [
      {
        number: 1,
        kind: "recorded",
        title: "계약 생성",
        body: "광고주가 프로젝트, 크리에이터 조건, USDC 예산과 마일스톤 결과물을 정의합니다."
      },
      {
        number: 2,
        kind: "recorded",
        title: "Creator Passport로 지원",
        body: "Demo Creator가 기술, 언어, 포트폴리오와 업무 조건이 담긴 지갑 서명 프로필로 지원합니다."
      },
      {
        number: 3,
        kind: "recorded",
        title: "지원자 검토 및 선택",
        body: "광고주가 지원서를 확인하고 선택한 크리에이터를 escrow에 지정합니다."
      },
      {
        number: 4,
        kind: "recorded",
        title: "USDC escrow 예치",
        body: "광고주가 정확한 예치 금액을 승인하고 Arc escrow에 테스트 USDC를 입금합니다."
      },
      {
        number: 5,
        kind: "recorded",
        title: "마일스톤 제출",
        body: "선택된 크리에이터가 완료한 작업을 광고주 검토용으로 제출합니다."
      },
      {
        number: 6,
        kind: "onchain",
        title: "지급 및 검증",
        body: "광고주가 승인한 마일스톤을 지급합니다. 아래 결과는 Arc의 거래 이벤트와 escrow 상태가 일치할 때만 검증 완료로 표시됩니다."
      }
    ]
  }
};

export function resolveDemoLocale(value?: string | string[]): DemoLocale {
  const requested = Array.isArray(value) ? value[0] : value;
  return requested === "ko" ? "ko" : "en";
}

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
    return {
      locale,
      copy: getReviewerDemoCopy(locale),
      verification: { status: "verified", receipt }
    };
  } catch (error) {
    const code: ReceiptErrorCode =
      error instanceof ReceiptError ? error.code : "RPC_UNAVAILABLE";
    return {
      locale,
      copy: getReviewerDemoCopy(locale),
      verification: { status: "unavailable", code }
    };
  }
}
