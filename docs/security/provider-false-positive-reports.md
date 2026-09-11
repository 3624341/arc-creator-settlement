# 지갑 보안 탐지 오탐 신고 자료

이 문서는 `creatorsettle.com`이 지갑 보안 탐지 목록에 잘못 등록되었을 때 공식 채널에 제출할 수 있는 자료다. 지갑 경고를 우회하거나 사용자의 서명을 유도하기 위한 문서가 아니다. 경고가 표시되면 연결·서명을 중단하고 각 제공자의 공식 검토 채널을 사용한다.

## 공통 정보

- Domains: `https://creatorsettle.com`, `https://www.creatorsettle.com`
- Service: Creator Settlement
- Purpose: Arc Testnet에서 광고주와 크리에이터의 USDC milestone escrow를 검증하는 테스트넷 애플리케이션
- Source: https://github.com/3624341/arc-creator-settlement
- Security page: https://creatorsettle.com/security
- Network scope: Base Sepolia and Arc Testnet only
- Secrets: seed phrase, Secret Recovery Phrase, private key, and wallet password are never requested
- Signing scope: `personal_sign` for profile/application ownership verification; USDC approval only for an escrow amount selected by the advertiser

## MetaMask / eth-phishing-detect

Submit through the [MetaMask eth-phishing-detect issue tracker](https://github.com/MetaMask/eth-phishing-detect/issues).

Suggested title:

```text
[Unblock Legitimate Site] creatorsettle.com
```

Suggested body:

```text
Domain:
https://creatorsettle.com
https://www.creatorsettle.com

Creator Settlement is a legitimate testnet-only creator payment and milestone escrow application.

The site never asks users for a seed phrase, Secret Recovery Phrase, private key, recovery phrase, or wallet password.

The application uses:
- personal_sign for creator profile and application ownership verification
- ERC-20 USDC approve only for the advertiser-selected escrow amount
- explicit user-triggered network switching
- Base Sepolia and Arc Testnet only

The automatic wallet_addEthereumChain flow was removed from the public production path, and the cross-chain funding feature is currently disabled while the security review is in progress.

GitHub:
https://github.com/3624341/arc-creator-settlement

Security details:
https://creatorsettle.com/security

Please review creatorsettle.com and www.creatorsettle.com for a possible false positive.
```

## OKX Wallet

Use `Report that this site doesn't contain threats` on the OKX warning page. If the inline report is unavailable, use the [OKX Wallet support center](https://web3.okx.com/help). Include both domains, the GitHub repository, the security page, and the screenshots of the warning.

## UniSat

Use the support ticket system in the [official UniSat Discord](https://discord.gg/unisat). State that the warning is a false positive for an EVM testnet application, not a UniSat impersonation site. Include both domains, the GitHub repository, the security page, and the same common information above.

## ChainPatrol

If the warning or lookup identifies ChainPatrol as the source, submit a false-positive review through the ChainPatrol reporting flow. Include both domains and explain that the service is testnet-only, does not collect wallet secrets, and currently has cross-chain funding disabled during review.

## Evidence to attach

- Screenshot of the warning and the report link shown by the wallet
- Screenshot of `/security`
- Link to the GitHub repository and the relevant commit
- Link to the Vercel Production deployment if requested
- Public Arc Testnet contract and explorer links, without sharing private keys or wallet recovery data

