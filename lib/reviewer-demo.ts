import { loadSettlementReceipt } from "./receipts/chain";
import { receiptErrorView, type ReceiptErrorView } from "./receipts/presentation";
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
  navigation: {
    label: string;
    product: string;
    demo: string;
    security: string;
    github: string;
    language: string;
  };
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
  evidenceLabel: string;
  networkLabel: string;
  milestoneLabel: string;
  recipientLabel: string;
  releasedByLabel: string;
  confirmedAtLabel: string;
  blockLabel: string;
  escrowLabel: string;
  transactionLabel: string;
  resourceCards: {
    github: { title: string; body: string };
    koreanGuide: { title: string; body: string };
    builderHub: { title: string; body: string };
    security: { title: string; body: string };
  };
  footerEvidence: string;
  footerProduct: string;
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
    navigation: {
      label: "Reviewer demo navigation",
      product: "Product",
      demo: "Reviewer Demo",
      security: "Security",
      github: "GitHub",
      language: "Language"
    },
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
    evidenceLabel: "Evidence",
    networkLabel: "Network",
    milestoneLabel: "Milestone",
    recipientLabel: "Recipient",
    releasedByLabel: "Released by",
    confirmedAtLabel: "Confirmed at",
    blockLabel: "Block",
    escrowLabel: "Escrow",
    transactionLabel: "Transaction",
    resourceCards: {
      github: { title: "GitHub repository", body: "Inspect the source, contracts, tests, and implementation history." },
      koreanGuide: { title: "Korean Arc build guide", body: "Read the Korean-language guide for builders starting on Arc." },
      builderHub: { title: "Arc Builder Hub", body: "Explore practical resources collected for the Arc builder community." },
      security: { title: "Security disclosure", body: "Review wallet boundaries, testnet assumptions, and safety controls." }
    },
    footerEvidence: "Read-only Arc Testnet evidence · No wallet required",
    footerProduct: "Creator Settlement · Testnet demonstration",
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
    navigation: {
      label: "리뷰어 데모 탐색",
      product: "제품",
      demo: "리뷰어 데모",
      security: "보안",
      github: "GitHub",
      language: "언어"
    },
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
    evidenceLabel: "검증 자료",
    networkLabel: "네트워크",
    milestoneLabel: "마일스톤",
    recipientLabel: "수령인",
    releasedByLabel: "지급 실행자",
    confirmedAtLabel: "확인 시각",
    blockLabel: "블록",
    escrowLabel: "에스크로",
    transactionLabel: "거래",
    resourceCards: {
      github: { title: "GitHub 저장소", body: "소스 코드, 컨트랙트, 테스트와 구현 이력을 확인하세요." },
      koreanGuide: { title: "한국어 Arc 빌드 가이드", body: "한국 개발자를 위한 Arc 시작 가이드를 읽어보세요." },
      builderHub: { title: "Arc 빌더 허브", body: "Arc 빌더 커뮤니티를 위해 정리한 실용 자료를 살펴보세요." },
      security: { title: "보안 공개 문서", body: "지갑 경계, 테스트넷 가정과 안전장치를 확인하세요." }
    },
    footerEvidence: "읽기 전용 Arc 테스트넷 증거 · 지갑 연결 불필요",
    footerProduct: "Creator Settlement · 테스트넷 데모",
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

const KOREAN_ERRORS: Record<ReceiptErrorCode, ReceiptErrorView> = {
  INVALID_TRANSACTION_HASH: {
    eyebrow: "링크 확인",
    title: "잘못된 영수증 링크입니다",
    body: "유효한 Arc 거래 해시가 없습니다. 정산 페이지에서 영수증 링크를 다시 복사해 주세요."
  },
  TRANSACTION_NOT_FOUND: {
    eyebrow: "Arc 조회",
    title: "거래를 찾을 수 없습니다",
    body: "Arc가 아직 이 거래를 반환하지 않았습니다. 방금 제출했다면 잠시 후 다시 확인해 주세요."
  },
  TRANSACTION_REVERTED: {
    eyebrow: "온체인 상태",
    title: "거래가 되돌려졌습니다",
    body: "이 거래는 완료되지 않았으므로 정산 증거로 사용할 수 없습니다."
  },
  PAYMENT_EVENT_NOT_FOUND: {
    eyebrow: "영수증 확인",
    title: "정산 영수증이 아닙니다",
    body: "실제 거래이지만 Creator Settlement의 Arc 지급 이벤트가 포함되어 있지 않습니다."
  },
  PAYMENT_EVENT_AMBIGUOUS: {
    eyebrow: "영수증 확인",
    title: "영수증 확인이 필요합니다",
    body: "한 거래에서 여러 지급 이벤트가 발견되어 앱이 임의로 하나를 선택하지 않습니다."
  },
  CONTRACT_STATE_MISMATCH: {
    eyebrow: "검증 확인",
    title: "영수증 검증에 실패했습니다",
    body: "거래 이벤트와 에스크로 상태가 일치하지 않아 지급 완료로 표시하지 않습니다."
  },
  RPC_UNAVAILABLE: {
    eyebrow: "네트워크 상태",
    title: "Arc 연결이 일시적으로 원활하지 않습니다",
    body: "공개 Arc RPC에서 검증을 완료하지 못했습니다. 거래 상태가 바뀐 것은 아니므로 잠시 후 다시 확인해 주세요."
  }
};

export function reviewerDemoErrorView(locale: DemoLocale, code: ReceiptErrorCode): ReceiptErrorView {
  return locale === "ko" ? KOREAN_ERRORS[code] : receiptErrorView(code);
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
