# Lesson Code Room — independent verification 4 handoff

## Release status

**FAIL — do not release.**

Verified candidate `8100b1e95bf2c3cb929832e74878f8fdd5fa3069` locally and at https://lesson-code-room.sociobot.in on 2026-08-28. Live `/health` reports that exact SHA, and the live HTML/JS/CSS hashes match the local build.

The complete evidence and reproduction details are in `.factory/verification-4.md`. No product code was changed.

## Release blockers

- Live **Buy Room Plus** returns HTTP 404 from the advertised Sociobot checkout endpoint.
- **Reset demo** changes the room link but the prior room's polling loop writes old learners into the new board.
- Demo learner join and workbench views omit the required demo banner, Reset demo, and Start for real controls.
- Rotating a caller-supplied `X-Forwarded-For` bypasses API rate limiting (48/48 requests escaped 429).
- Running after Done changes the teacher state back to Ran code while the learner button still says Marked as done.
- The real 404 page has a serious axe color-contrast failure (1.57:1 for the decorative 404 number).

Additional P2 findings: learner JavaScript errors are hidden while the UI reports Ran code; several 390 px navigation/footer targets are smaller than 44×44 px; progress responses lack `Cache-Control: no-store`; unversioned art is cached immutable for a year; paid terms omit merchant-of-record/refund wording.

## Verification summary

- Required first-read gate: PASS.
- One-click sample-data entry: PASS on the landing page; persistent demo treatment: FAIL on learner views.
- `.factory/claims.json`: present; all 16 exact commands passed after `npm ci`. Independent expanded cases falsified `demo-reset`, exposed the rate-limit bypass, and found the real checkout unavailable.
- `npm test`: PASS, 22/22 Playwright tests plus 2 Rust tests.
- TypeScript, Rust formatting, strict Clippy, Vite build, and locked Rust release build: PASS.
- Live normal teacher/learner editing, run, offline preview, reset, and progress path: PASS except for Done regression and hidden runtime errors.
- Validation/capacity: PASS; 10 joins succeeded and the 11th returned `409 room_full`.
- Fixed-identity rate bursts: every API route/method returned 429 with `Retry-After: 1`; effective anti-abuse behavior still FAILS because caller-controlled rotating addresses bypass it.
- Live load smoke: 100/100 concurrent reads returned 200 in 418 ms.
- Runtime with only `PORT`: PASS; local SQLite state survived restart.
- Landing, demo, join, workbench, privacy, and terms axe scans: PASS; 404 axe scan: FAIL.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.7 s, CLS 0.021.
- Bundle budgets: PASS (27.65 KB JS, 17.50 KB CSS, 71.35 KB fonts, 22.32 KB mobile hero; raw sizes).
- Privacy/network and sandbox policies: PASS in the normal flow; API no-store policy remains a finding.

## How to verify

```sh
npm ci
npm test
npx tsc --noEmit -p frontend/tsconfig.json
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
```

Then test the exact deployed identity with:

```sh
curl https://lesson-code-room.sociobot.in/health
curl -i https://api.sociobot.in/api/v1/products/lesson-code-room/checkout
```

Open `/demo`, add a uniquely named learner, select **Reset demo**, and watch the new board for at least five seconds; the old learner must never return. Follow the demo learner link and require the demo banner and both demo controls on join and workbench screens. Mark a learner Done, run again, and require teacher and learner state to remain consistent. Burst each API route with a normal client and with caller-supplied forwarding headers; both must rate-limit.

## Verification limitation

The verifier image has no Docker-compatible engine. The production frontend and locked Rust release builds, no-config binary runtime, persistence restart, and exact live build identity were verified instead.
