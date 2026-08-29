# Lesson Code Room — review 2 handoff

Date: 2026-08-29

## Result

**FAIL.** This reviewer changed no product code. The review is recorded in `.factory/review-2.md`.

Two findings remain:

1. **F-2-1 (BLOCKING):** `/api/demo` writes demo rooms and participants through the same production `Store` and Blob/SQLite room namespace as live rooms. Demo needs a separate ephemeral tenant or storage namespace.
2. **F-2-2:** “A sample room opens with three learners” is an unlisted numerical claim. Add a claim and tagged assertion, or remove the number.

## Verification performed

- Fresh remote browser contexts at 390 × 844 and 1440 × 900; inspected the first screen before scrolling.
- One-click live demo, reset, sample signals, browser storage, same-origin request log, 200% text reflow, route metadata, links, 404, and console checks.
- Fresh clone at `/tmp/lesson-code-room-review-2`: `npm ci`, all 16 exact `.factory/claims.json` commands independently, then full `npm test` (3 Rust tests and 35 Playwright tests). All declared tests passed.
- Read the brief, design thesis, claims, demo documentation, README, review 1, polish 1, and prior handoff; rechecked every earlier review finding.

## Next step

Implement the two review findings, then repeat the full claim gate and adversarial review. The working tree remains buildable; only `.factory/review-2.md` and this handoff were changed.
