# Arc Creator Settlement v0.3 — 사용자 권한이 필요한 최소 작업

코드/스마트컨트랙트/Grant 문서는 준비되어 있다. 아래 값은 보안상 ChatGPT에 보내면 안 되며, **본인 PC의 `.env.local`에만 저장**한다.

## 1. Circle Developer Console에서 3가지 준비

### A. Testnet API Key
Circle Console에서 Testnet 환경을 선택한 뒤 API Key를 생성한다.

`.env.local`:

```bash
CIRCLE_API_KEY=여기에_본인_API_KEY
```

### B. Entity Secret 등록
Circle Developer-Controlled Wallets / Contracts가 서명 작업을 수행하려면 Entity Secret이 등록되어 있어야 한다. 이 프로젝트에는 생성/등록 스크립트까지 포함되어 있다.

API Key를 `.env.local`에 먼저 넣은 뒤:

```bash
npm run circle:entity:generate
```

터미널에 생성된 Entity Secret을 **채팅에 보내지 말고** `.env.local`의 아래 값에 넣는다.

```bash
CIRCLE_ENTITY_SECRET=여기에_본인_ENTITY_SECRET
```

그다음:

```bash
npm run circle:entity:register
```

- 생성되는 recovery file은 안전한 별도 위치에 보관한다.
- Entity Secret과 recovery file은 절대 채팅/GitHub에 올리지 않는다.

### C. User-Controlled Wallet App ID
Circle Console의 **Wallets → User Controlled → Configurator**에서 App ID를 확인한다.

`.env.local`:

```bash
NEXT_PUBLIC_CIRCLE_APP_ID=여기에_APP_ID
```

> App ID는 브라우저에 노출되는 식별자지만, API Key와 Entity Secret은 서버 전용 비밀값이다.

---

## 2. 로컬 설치

ZIP을 압축 해제한 폴더에서 PowerShell/터미널을 연다.

```bash
npm install
copy .env.example .env.local
```

macOS/Linux라면:

```bash
cp .env.example .env.local
```

그다음 `.env.local`에 API Key와 App ID를 입력하고, 위 `circle:entity:*` 명령으로 Entity Secret을 생성·등록한다.

---

## 3. Circle 배포용 Arc Testnet 지갑 생성

```bash
npm run circle:wallet
```

성공하면 아래 3개가 출력된다.

```bash
CIRCLE_DEPLOYER_WALLET_SET_ID=...
CIRCLE_DEPLOYER_WALLET_ID=...
CIRCLE_DEPLOYER_WALLET_ADDRESS=0x...
```

이 세 값은 `.env.local`에 복사한다. **주소/ID는 공개해도 되지만 API Key/Entity Secret은 공개하면 안 된다.**

---

## 4. Faucet 충전 — 여기서 사용자 클릭이 필요

출력된 `CIRCLE_DEPLOYER_WALLET_ADDRESS`에 Circle Faucet을 사용해 Arc Testnet USDC를 받는다. 이 USDC가 Circle Contracts 배포 gas/transaction 비용에 사용된다.

Faucet 완료 후:

```bash
npm run circle:deploy
```

이 명령은 Hardhat으로 `EscrowFactory.sol`을 compile하고 **Circle Contracts SDK를 통해 ARC-TESTNET에 배포 요청**을 보낸다.

배포 완료 후 factory 주소를:

```bash
NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=0x배포된주소
```

에 넣는다.

---

## 5. 앱 실행

```bash
npm run dev
```

브라우저에서:

```text
http://localhost:3000
```

### 데모 흐름

1. `Circle Wallet` → 테스트 사용자 ID 입력
2. Circle PIN flow로 ARC-TESTNET SCA wallet 생성
3. `Create Contract` → Creator 주소(선택사항) + milestones 입력
4. Creator 주소를 비워두었다면 creator 지갑에서 공고를 열고 `Apply as creator` 서명
5. 광고주 지갑의 `My Page → Applications received`에서 지원자를 선택하고 `assignCreator(address)` 승인
6. Contract 상세 → USDC approve → deposit
7. 선택된 Creator가 milestone submit
8. Client `approveAndRelease()`
9. 화면에 표시되는 `View public receipt`로 영수증 열기
10. 영수증의 금액·Creator·Block과 ArcScan transaction 비교

영수증 주소 형식:

```text
https://배포주소/receipt/0x전체_트랜잭션_해시
```

영수증은 지갑 연결 없이 열려야 한다. 데이터베이스가 없어도 작동하며, Arc RPC에서 transaction/event/contract state를 다시 검증한다.

---

## 6. 보안 규칙

절대 보내거나 공개하지 말 것:

- `CIRCLE_API_KEY`
- `CIRCLE_ENTITY_SECRET`
- private key가 있다면 private key
- Circle recovery file

ChatGPT에 알려줘도 되는 것:

- `CIRCLE_DEPLOYER_WALLET_ADDRESS`
- 배포된 `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS`
- ArcScan transaction URL/hash
- GitHub 공개 저장소 URL
- Vercel 공개 URL

---

## 7. 선택 사항 — 공개 Recent Receipts 목록

공용 영수증 목록이 필요할 때만 Supabase를 연결한다.

1. Supabase SQL Editor에서 `supabase/schema.sql` 실행
2. Vercel 서버 환경변수에 아래 두 값 추가

```bash
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```

`SUPABASE_SECRET_KEY`에는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. Supabase가 없어도 개별 영수증과 브라우저 로컬 최근 기록은 정상 작동한다.

지원서와 Creator Passport가 다른 브라우저에도 보이려면 먼저 Supabase SQL Editor에서 기존 DB에 `supabase/migrations/20260909_creator_passport.sql`을 실행한다. 새 DB라면 `supabase/schema.sql`을 실행한다. 그다음 `SUPABASE_URL`과 `SUPABASE_SECRET_KEY`를 서버 전용 환경변수로 저장하고 `/api/applications`와 `/api/profiles`가 활성화되어야 한다. `SUPABASE_SECRET_KEY`에는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.

Creator Passport 편집은 현재 Browser Wallet의 `personal_sign`을 사용한다. Circle Wallet 사용자는 공개 프로필 조회와 기존 Arc 계약·지급 기능을 사용할 수 있지만 프로필 생성·수정은 Browser Wallet으로 전환해야 한다. 프로필의 SNS 링크와 follower count는 실제 소유권 검증이 아니며 UI에서 항상 `Self-reported`로 표시된다.

지원자 선택은 브라우저 UI가 아니라 광고주 지갑의 Arc 온체인 `assignCreator` 트랜잭션을 먼저 확인한 뒤 서버에 `Selected` 상태를 기록한다. 기존 profile 없는 application도 fallback card로 표시되며 삭제·강제 무효화되지 않는다.

### Creator Passport 수동 QA

1. Browser Wallet으로 `/profile/edit`에서 필수 필드와 HTTPS 링크를 입력하고 미리보기 후 서명한다.
2. 서명을 취소하면 DB에 저장되지 않는지 확인한다.
3. 시크릿 창에서 `/creators/<wallet>`을 열어 공개 프로필·Self-reported 라벨·Arc Settlement Verified 집계를 확인한다.
4. `is_public=false` 프로필이 공개 URL에서 지갑 정보 없이 empty state를 보이는지 확인한다.
5. 미완성 프로필로 공고 지원 시 저장되지 않고 `/profile/edit` 안내가 보이는지 확인한다.
6. 광고주 My Page에서 Applicant Card의 역할·언어 필터, Arc verified first 정렬, View profile, Select creator를 확인한다.
7. 기존 profile 없는 application이 fallback card로 보이고 Select creator 흐름이 계속 작동하는지 확인한다.

---

## 8. Vercel 배포

GitHub 저장소를 Vercel에 Import한 뒤 `.env.example`의 공개 설정과 본인 Circle 설정을 입력한다. 먼저 Preview 배포에서 확인하고 Production으로 승격한다.

필수 확인:

1. `/`에서 Arc Testnet이 Online으로 표시되는지
2. `/dashboard`가 열리는지
3. 실제 milestone release 뒤 영수증 링크가 생기는지
4. 로그아웃/시크릿 창에서도 영수증이 열리는지
5. ArcScan과 영수증 값이 일치하는지

---

## 9. Discord 지원 자료 완성

실제 배포와 transaction이 생기면 `docs/discord-application-evidence.md`의 `PENDING` 항목을 다음 실제 증거로 교체한다.

- Vercel 공개 URL
- Factory/escrow 주소
- 전체 release transaction hash
- 공개 receipt URL
- ArcScan URL

구현만 완료된 기능과 실제 배포·사용 증거를 구분해서 작성한다.

---

## 10. 배포 후 정리할 자료

실제 factory 주소/transaction이 생기면 다음 자료의 placeholder를 실제 증거로 교체한다.

- `docs/grant-application.md`
- `docs/demo-video-script.md`
- `docs/submission-checklist.md`
- `docs/discord-application-evidence.md`
- Pitch Deck
- README

그 후 Vercel 공개 배포, GitHub 정리, ArcScan 증거 수집, 5분 데모 영상 구성, Questbook 최종 제출 순서로 간다.
