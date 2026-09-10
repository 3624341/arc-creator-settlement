# Cross-chain Funding MVP (Base Sepolia → Arc Testnet)

## 구현 범위

광고주가 브라우저 지갑에 보유한 Base Sepolia 테스트 USDC를 같은 지갑 주소의 Arc Testnet으로 브리지한 뒤, 기존 Arc escrow의 `approve USDC`와 `deposit()`을 별도로 실행할 수 있습니다.

- 출발 체인: Base Sepolia (`84532`)
- 도착 체인: Arc Testnet (`5042002`)
- 자산: USDC만 지원
- 지갑: 기존 MetaMask, Rabby, Coinbase Wallet, OKX Wallet 주입 provider
- 브리지: Circle App Kit Bridge의 CCTP 흐름
- 지급·public receipt: 기존 Arc escrow 흐름 재사용
- 제외: creator의 타 체인 수령, Ethereum Sepolia, Circle Wallet 브리지, Gateway 통합 잔액, 타 체인 출금

브리지 완료는 escrow funding 완료가 아닙니다. SDK의 최종 결과와 Arc USDC 잔액을 다시 확인한 뒤에만 기존 `Approve USDC`와 `Deposit to escrow` 버튼을 활성화합니다.

## 사용 SDK와 공식 문서

현재 lockfile에 고정된 패키지는 다음과 같습니다.

- `@circle-fin/app-kit` `1.14.0`
- `@circle-fin/adapter-viem-v2` `1.17.1`
- `viem` `2.36.0` 계열

사용한 공식 문서:

- [Arc App Kit Bridge](https://docs.arc.io/app-kit/bridge)
- [Bridge Tokens Across Blockchains Quickstart](https://docs.arc.io/app-kit/quickstarts/bridge-tokens-across-blockchains)
- [Supported Blockchains](https://docs.arc.io/app-kit/references/supported-blockchains)
- [Circle USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [Arc CCTP Bridging](https://docs.arc.io/integrate/exchanges/cctp-bridging)

App Kit의 `createViemAdapterFromProvider`, `kit.estimateBridge`, `kit.bridge`, `kit.retryBridge`, wildcard event listener를 사용합니다. 브라우저 지갑에서는 서명 가능한 EIP-1193 provider만 사용하며 private key, seed, Entity Secret은 읽거나 저장하지 않습니다. 지갑 호환성을 높이고 승인·burn 진행을 구분하기 위해 `batchTransactions: false`로 순차 실행합니다.

## 공개 설정과 로컬 실행

`.env.local`에 `.env.example`의 값을 복사합니다.

```env
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASE_SEPOLIA_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

RPC나 토큰 주소를 바꾸는 경우에도 공개 설정만 사용합니다. Base Sepolia USDC 주소는 Circle 공식 주소를 기준으로 합니다. Arc USDC 주소는 기존 프로젝트 설정을 사용합니다.

```bash
npm install
npm run dev
```

## 사용자 흐름

1. Arc escrow 상세페이지에서 광고주 브라우저 지갑을 연결합니다.
2. 크리에이터가 지정되어 있고 escrow가 아직 created 상태인지 확인합니다.
3. `Fund from another chain`을 엽니다.
4. Base Sepolia USDC 잔액, Base Sepolia ETH 가스 잔액, Arc USDC 잔액을 확인합니다.
5. escrow 필요액 이상을 입력하고 `Get fee estimate`를 눌러 protocol fee, 예상 도착액, 각 체인 gas estimate를 확인합니다.
6. `Bridge to Arc`를 누르고 지갑에서 Base Sepolia 승인·burn 서명을 순서대로 승인합니다.
7. 진행 단계의 BaseScan/ArcScan 링크와 source/destination transaction hash를 확인합니다.
8. Circle SDK 최종 성공 결과와 Arc USDC 잔액이 escrow 필요액 이상이면 기존 `Approve USDC`를 실행합니다.
9. approve 확인 후 `Deposit to escrow`를 실행합니다.
10. 이후 milestone release와 public receipt는 기존 Arc 전용 흐름을 사용합니다.

## 중단·실패·새로고침 복구

브라우저 localStorage의 `arc-cross-chain-funding`에는 작업 id, 지갑·escrow 범위, 체인, 토큰, 정수 atomic amount, source/destination/funding hash, 상태와 시각만 저장합니다. 저장값은 성공 증거가 아니며, 복구 시 Arc RPC 잔액과 SDK 결과를 다시 확인합니다.

- source transaction hash가 저장된 뒤에는 일반 Bridge 버튼으로 새 burn을 시작하지 않습니다.
- 새로고침 후 source hash가 있으면 새 브리지를 실행하지 말고 `Refresh balances`로 attestation/mint 도착을 확인합니다.
- 메모리에 SDK 오류 결과가 남아 있고 SDK가 해당 오류를 retryable로 판정할 때만 `kit.retryBridge`를 사용합니다.
- 새로고침 뒤 opaque SDK 결과가 없으면 자동 재전송하지 않습니다. 저장된 source hash를 BaseScan에서 확인하고, Arc 도착 지연이면 잠시 후 잔액을 새로고침합니다.
- timeout은 전송 실패나 환불로 단정하지 않습니다.
- 지갑 계정이 바뀌면 기존 작업을 새 계정에 연결하지 않고 작업을 격리합니다.
- 서명 거절, 지원하지 않는 지갑, 잘못된 네트워크, USDC/가스 부족, 견적 실패, Arc 도착 지연, escrow approve/deposit 실패를 각각 별도 메시지로 안내합니다.

## 검증

로컬에서 실행할 수 있는 검증:

```bash
npm run test:web
npm test
npm run build
```

웹 테스트에는 정수 금액 검증, localStorage 형식 검증과 지갑·escrow 격리, source hash 이후 중복 실행 방지, Arc 잔액 확인 전 funding 금지 테스트가 포함되어 있습니다.

실제 테스트넷 검증은 테스트 USDC·Base Sepolia ETH와 사용자의 브라우저 지갑 서명이 필요합니다. 이 작업에서는 사용자 지갑을 대신 서명하지 않았으므로 실제 burn/mint 또는 escrow deposit 성공을 검증했다고 보고하지 않습니다.

## 알려진 제한과 메인넷 전 재검토

- 현재 작업 상태는 브라우저 localStorage 기반이라 같은 브라우저·프로필에서만 복구됩니다.
- 브리지 작업을 서버 DB에 기록하거나 서버가 지갑을 대신 제어하지 않습니다.
- 기본 Base Sepolia public RPC는 데모용입니다. 운영 전에는 안정적인 RPC, rate limit, 장애 대응을 재검토해야 합니다.
- 실제 지갑·토큰·gas 잔액이 없으면 SDK 견적 및 브리지를 완료할 수 없습니다.
- Arc Testnet과 Base Sepolia만 지원합니다.
- 메인넷 전에는 체인/토큰 주소, CCTP 수수료, gas 단위, SDK 버전, explorer URL, retry/attestation 정책, RPC 신뢰성, 잔액 polling timeout, 서버 측 감사 로그와 모니터링을 다시 검토해야 합니다.
- 기존 escrow 컨트랙트는 변경하거나 재배포하지 않았습니다. 브리지 정보는 기존 milestone 지급 receipt와 합치지 않습니다.
