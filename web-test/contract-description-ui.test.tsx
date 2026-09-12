import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { JobDescriptionField } from "../components/JobDescriptionField";
import { parseContractDraft, serializeContractDraft } from "../lib/contract-draft";

Object.assign(globalThis, { React });

test("job description field is accessible and exposes the enforced character limit", () => {
  const html = renderToStaticMarkup(<JobDescriptionField value="" onChange={() => undefined} />);
  assert.match(html, /<textarea/);
  assert.match(html, /aria-label="Job description"/);
  assert.match(html, /maxlength="2000"/i);
  assert.match(html, /20–2,000 characters/);
});

test("create contract drafts preserve descriptions and reject malformed saved values", () => {
  const draft = {
    title: "Arc creator education",
    description: "Create a practical Korean guide for new Arc builders.",
    creator: "",
    milestones: [{ description: "Publish guide", amount: "10" }]
  };

  assert.deepEqual(parseContractDraft(serializeContractDraft(draft)), draft);
  assert.equal(parseContractDraft("not-json"), undefined);
  assert.equal(parseContractDraft(JSON.stringify({ ...draft, description: 123 })), undefined);
});

test("create page connects the description to validation, local fallback, and confirmed metadata storage", () => {
  const source = readFileSync(new URL("../app/contracts/create/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<JobDescriptionField/);
  assert.match(source, /validateContractDraft\(title, description, creator, milestones\)/);
  assert.match(source, /description:\s*description\.trim\(\)/);
  assert.match(source, /saveContractMetadata\(/);
  assert.match(source, /escrowAddress/);
  assert.match(source, /description could not be published/i);
});
