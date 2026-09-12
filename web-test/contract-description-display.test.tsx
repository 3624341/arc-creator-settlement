import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContractCard } from "../components/ContractCard";
import { ContractDescriptionSection } from "../components/ContractDescriptionSection";

Object.assign(globalThis, { React });

const contract = {
  id: "0x1111111111111111111111111111111111111111",
  title: "Arc creator onboarding",
  description: "Create a Korean onboarding guide that helps new creators use Arc Testnet safely.",
  creator: "0x2222222222222222222222222222222222222222",
  advertiser: "0x3333333333333333333333333333333333333333",
  totalUsdc: "25",
  status: "Created"
};

test("dashboard cards show a concise public description preview", () => {
  const html = renderToStaticMarkup(<ContractCard contract={contract} />);
  assert.match(html, /Create a Korean onboarding guide/);
  assert.match(html, /line-clamp-2/);
});

test("contract details show the full description and an old-contract fallback", () => {
  const described = renderToStaticMarkup(<ContractDescriptionSection description={contract.description} />);
  assert.match(described, /About this opportunity/);
  assert.match(described, /Create a Korean onboarding guide/);

  const legacy = renderToStaticMarkup(<ContractDescriptionSection />);
  assert.match(legacy, /The advertiser has not added a public description yet/);
});
