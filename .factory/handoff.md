# Lesson Code Room — review 1 handoff

Date: 2026-08-29

Work order: `lesson-code-room-review-1`

## Done

- Performed the requested adversarial first-read review against the live site in fresh 390 px and desktop browser contexts.
- Read the brief, design, claims, demo documentation, prior handoff, and every prior verification report. There were no prior `review-*` or `polish-*` reports.
- Wrote `.factory/review-1.md`. No product source was modified.

## Verification

- Fresh first-read, one-click demo, demo banner/reset, learner join/workbench, request-origin, route/metadata, link crawl, and 200% text checks.
- Clean clone `/tmp/lesson-code-room-review-lwXoNq`: `npm ci` passed with 0 vulnerabilities; all 16 exact claim commands passed independently; `npm test` passed (32 Playwright tests); `npx tsc -p frontend/tsconfig.json --noEmit` passed.
- Retested prior overload behavior with 60 live same-client joins: 7 × 200, 19 × 409, 34 × 429, 0 × 500.

## Result

**FAIL.** `.factory/review-1.md` records ten findings. The three blockers are:

1. `/demo` first renders a loading screen rather than populated sample product use.
2. 200% text at 390 px creates 60–99 px horizontal overflow.
3. “See the room, not private screens.” has no matching claim inventory/test.

Also repair per-route social metadata, four information-free/metaphoric landing eyebrows, and two README sentences exceeding 22 words. Re-run the complete first-read review after repair.
