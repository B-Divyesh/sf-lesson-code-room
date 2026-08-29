# Lesson Code Room — review 3 handoff

Date: 2026-08-29  
Review commit: recorded after `ff9051f45aa4aa41497b775fd8255ed7dff700c4`

## Result

No product code was changed. The requested adversarial first-read review is in `.factory/review-3.md`.

The review verdict is **FAIL** for one P2 copy issue: the designed 404 uses the metaphorical H1 “This page is not in the room.” Replace it with “Page not found” and add a regression assertion. Everything else reviewed passes, including first-read clarity, sample/demo isolation behaviour, current claims, routing, metadata, mobile reflow, and previous finding repairs.

## Verification performed

- Fresh clone: `/tmp/lesson-code-room-review-3-mOKfX1`; `npm ci` passed with 0 vulnerabilities.
- `npm test -- --grep '@claim:'` passed all 18 declared claim tests.
- `npm test` passed: production Vite build, 4 Rust tests, and 36 Playwright tests.
- `npx tsc -p frontend/tsconfig.json --noEmit`, `cargo fmt --all -- --check`, and `cargo clippy --all-targets --all-features -- -D warnings` passed.
- Fresh live Chromium at mobile 390 × 844 and desktop 1440 × 900: first screen answers job, audience, and first action; no ordinary console errors; landing has no horizontal overflow.
- Live one-click demo showed the populated three-learner sample before provision completed, the persistent demo banner, Reset demo, Start for real, separately named `DEMO-*` rooms, and a working reset. Browser request logging showed product-origin traffic only plus the preview's opaque sandbox origin.
- Live route crawl checked `/`, `/demo`, `/privacy`, `/terms`, a 404, all discovered internal links, the checkout redirect, and Param Factory. Route titles, metadata, canonical/social fields, h1/main, responsive reflow, focus after navigation, legal/footer links, robots, sitemap, and favicon were checked.

## How to rerun

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
```

For manual verification, open <https://lesson-code-room.sociobot.in>, use **Try it with sample data**, and check the persistent demo treatment through the learner workbench.

## Known gap

The only open finding is `F-3-1` in `.factory/review-3.md`: use plain “Page not found” copy for the 404 H1.
