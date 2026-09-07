# Arc Builder Hub

Standalone public evidence hub for Arc projects and builder contributions.

## Product & Proof redesign

The standalone app is the redesigned builder portfolio. The settlement application remains a separate product. Start this app with `npm run dev -- --port 3100` from this directory.

The reading order is product, recorded payment evidence, Korean guide, implementation scope, updates, and roadmap. Addresses are available in a native disclosure with full-value copy controls. External links use one arrow and announce that they open a new tab.

The screenshot in `public/settlement-receipt.png` is an archived product capture from `../docs/evidence/arc-creator-settlement-receipt.png`. Payment figures and date are historical evidence from September 1, 2026, not live transaction volume. Sources are linked on the page.

### Release checks

- Run `npm test` and `npm run build`.
- Confirm mobile layout, keyboard navigation, disclosure, and clipboard behavior.
- Deploy this directory as the Vercel project root for the independent hub.
- Verify the production URL in a logged-out browser before sharing. The previously supplied preview URL required Vercel authentication.
- Once the stable public URL is confirmed, point the settlement app's older `/builder-hub` entry to that address to avoid maintaining two public introductions.
