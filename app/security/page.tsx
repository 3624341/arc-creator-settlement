import { Shell } from "@/components/Shell";

const externalLinks = [
  ["Source code on GitHub", "https://github.com/3624341/arc-creator-settlement"],
  ["Arc Testnet explorer", "https://testnet.arcscan.app"],
  ["MetaMask false-positive review", "https://github.com/MetaMask/eth-phishing-detect/issues"],
  ["OKX Wallet support", "https://web3.okx.com/help"],
  ["UniSat official Discord", "https://discord.gg/unisat"],
] as const;

export default function SecurityPage() {
  return (
    <Shell>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-arc-line bg-white/80 p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Security & trust</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Creator Settlement security</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-arc-muted">
            Creator Settlement is a testnet-only Arc milestone escrow demo. This page explains exactly what the app can request from a browser wallet and how to verify every action before signing.
          </p>
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
            Cross-chain funding is temporarily unavailable while the security review is in progress. Existing Arc settlement flows remain separate from bridge activity.
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-arc-line bg-white/80 p-7">
            <h2 className="text-2xl font-black">What the app may request</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-arc-muted">
              <li><b className="text-arc-ink">personal_sign:</b> creator profile and application ownership verification. It does not move funds.</li>
              <li><b className="text-arc-ink">USDC approve:</b> only for the amount selected for an Arc escrow before deposit.</li>
              <li><b className="text-arc-ink">Arc settlement transaction:</b> escrow deposit, milestone submission, or approved milestone release.</li>
              <li><b className="text-arc-ink">Testnet only:</b> Base Sepolia and Arc Testnet assets have no mainnet value.</li>
            </ul>
          </section>

          <section className="rounded-[2rem] border border-arc-line bg-white/80 p-7">
            <h2 className="text-2xl font-black">What we never request</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-arc-muted">
              <li>We never ask for a seed phrase or Secret Recovery Phrase.</li>
              <li>We never ask for a private key or wallet password.</li>
              <li>We never ask users to paste secrets into a website, chat, form, or terminal.</li>
              <li>We never claim that a timeout or warning means funds must be urgently moved.</li>
            </ul>
          </section>
        </div>

        <section className="rounded-[2rem] border border-arc-line bg-white/80 p-7">
          <h2 className="text-2xl font-black">Verify before signing</h2>
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-arc-muted md:grid-cols-2">
            <li><b className="text-arc-ink">1.</b> Confirm the address bar is <code>creatorsettle.com</code> or <code>www.creatorsettle.com</code>.</li>
            <li><b className="text-arc-ink">2.</b> Confirm the wallet network shown in the wallet popup.</li>
            <li><b className="text-arc-ink">3.</b> Confirm the token, amount, recipient, and contract action.</li>
            <li><b className="text-arc-ink">4.</b> Reject the request if the wallet warning or transaction preview is unclear.</li>
          </ol>
        </section>

        <section className="rounded-[2rem] bg-arc-ink p-7 text-white">
          <h2 className="text-2xl font-black">Public verification and reports</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
            The app is open about its source, testnet scope, and security review. If MetaMask, OKX, or UniSat shows a warning, do not connect or sign. Use the provider&apos;s official report channel and include the source code and testnet details below.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {externalLinks.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noreferrer" className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/15">{label} ↗</a>)}
          </div>
        </section>
      </div>
    </Shell>
  );
}
