import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import BuilderPage from "../app/builder/page";

test("builder hub exposes the public build proof and community contribution path", () => {
  const html = renderToStaticMarkup(<BuilderPage />);
  for (const expected of [
    "Builder based in Korea",
    "Arc Creator Settlement",
    "Arc Testnet",
    "5042002",
    "Public receipt",
    "ArcScan",
    "Korean Arc build guide",
    "Circle Wallet",
    "USDC escrow",
    "Join the Arc builder community"
  ]) {
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
