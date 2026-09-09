# QA remediation matrix

Baseline source: `95198d6` plus worktree-only changes. Target preview may be older than source. This matrix is updated as each remediation is verified.

| QA issue | Current source finding | Plan | Status |
|---|---|---|---|
| 01 RPC fallback | `app/dashboard/page.tsx` initializes a hard-coded demo fallback and silently keeps it on errors | Remove fallback; explicit loading/error/stale states | Verified |
| 02 shared applications | `lib/marketplace-store.ts` uses localStorage only | Separate backend/auth design before implementation | Blocked pending product/backend decision |
| 03 wallet sync | Shell and detail own independent state | Implement shared browser wallet event sync | Verified |
| 04 Applied reload | Source has restore helper but target preview reset was observed | Add regression coverage and verify current source | Verified |
| 05 completed actions | Detail treats only status 1 as funded and renders client actions for status 2 | Central action-state matrix | Verified |
| 06 creator history | Profile is local application driven | Add assigned/completed chain view or document backend dependency | Partial: public assigned history; app status still backend-dependent |
| 07 total escrowed | Dashboard sums nominal totals | Read actual USDC balances and label nominal total separately | Verified |
| 08 mobile wallet | Shell hides wallet UI on mobile | Add wallet action to mobile menu | Verified |
| 09 overflow | Responsive widths overflow at 375/768 | Fix container/grid min widths | Verified: navigation switches at lg |
| 10 receipt discovery | Direct receipt works; list depends on API/local hashes | Improve public receipt index path | Partial: paid detail now discovers PaymentReleased tx links; global index still backend-dependent |
| 11 form validation | Current create validation misses title/finite/precision | Add pure validator and tests | Verified |
| 12 invalid contract | Unknown contract route renders pseudo-pending/raw viem error | Validate code/chain and safe Not found UI | Verified |
| 13 role/apply | Apply is not tied to explicit posting lifecycle | Clarify direct settlement vs job flow | Blocked pending product decision |
| 14 wallet mode | Detail defaults to Circle | Persist active mode/provider consistently | Verified |
| 15 status copy | Submit and created banners can remain stale | Confirmed transaction state drives copy | Verified for browser submit; Circle remains async/indexed |
| 16 accessibility | Dynamic milestone inputs lack labels; Escape picker issue | Add names/focus handling | Verified |
| 17 alignment | Existing source includes aligned flex group; preview was old | Verify responsive regression | Verified |
| 18 recipient safety | Creator is immutable but review is sparse | Add recipient review and warning | Verified: payout recipient shown before role actions |

## Baseline verification

- `npm run test:web`: 44 passing under escalated Windows execution.
- `npm test`: 2 passing under escalated Windows execution.
- `npm run build`: passed under escalated Windows execution; Next warned about multiple lockfiles because this isolated worktree has its own lockfile beside the main checkout.
