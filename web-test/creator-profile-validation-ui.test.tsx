import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as profileFormModule from "../components/CreatorProfileForm";

Object.assign(globalThis, { React });

test("Creator Passport uses app validation instead of silent native form blocking", () => {
  const html = renderToStaticMarkup(
    <profileFormModule.CreatorProfileForm
      walletAddress="0xabcdef0123456789012345678901234567890123"
      onSaved={() => undefined}
    />,
  );

  assert.match(html, /novalidate/i);
});

test("Creator Passport field errors are announced and rendered in red", () => {
  const ProfileFieldError = (profileFormModule as unknown as {
    ProfileFieldError?: ComponentType<{ error?: string }>;
  }).ProfileFieldError;

  assert.equal(typeof ProfileFieldError, "function");
  if (!ProfileFieldError) return;

  const html = renderToStaticMarkup(<ProfileFieldError error="Bio must be between 40 and 1,000 characters." />);
  assert.match(html, /role="alert"/);
  assert.match(html, /text-red-600/);
  assert.match(html, /Bio must be between 40 and 1,000 characters/);
});
