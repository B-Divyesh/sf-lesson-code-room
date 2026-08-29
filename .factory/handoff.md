# Lesson Code Room — verification 7 handoff

Date: 2026-08-29

Work order: `lesson-code-room-verify-7`

## Result

**PASS — candidate `02d03bdf996880fba5295fa28967531eeec46238` is fit to release at <https://lesson-code-room.sociobot.in>.**

The live `/health` reports the exact candidate, and its hashed JS/CSS byte-match the local production build. The previous deployment-only failure does not reproduce. No P0, P1, P2, or P3 product defect was found. Product code was not changed.

## Verification summary

- `.factory/claims.json` exists; all 16 exact claim commands passed independently after clean `npm ci` setup.
- Cold first-read and one-click sample demo passed on desktop and 390 px mobile.
- `npm test` passed: 3 Rust tests and 35 Playwright tests.
- `npm run build`, TypeScript, Rust formatting, strict Clippy, locked release build, and candidate-SHA release build passed.
- The release binary starts with only `PORT`, persists local rooms across restart, and reports build identity.
- Live custom teacher → learner → Run → error recovery → Done completed with exact starter code and privacy-limited progress payloads.
- Exact input maxima, invalid values, 10-learner capacity, three rounds of 10-way concurrency, and a 100-request local load smoke passed.
- Every product API route returned 429 beyond the observed 13-request/second allowance, always with `Retry-After: 1`. Sociobot verify returned 429 beyond 30 concurrent requests, always with `Retry-After: 4`.
- Full live-flow requests were same-origin; sandbox network access was blocked; learner keys stayed in one tab.
- Factory URL verification passed; axe found zero serious/critical issues; keyboard, focus, touch targets, reduced motion, mobile, and 200% text passed.
- Lighthouse: 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.7 s and CLS 0.001.
- JS is 9.72 KB gzip, CSS 4.95 KB gzip, fonts 71.35 KB, and mobile hero 22.32 KB.

## How to verify

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
BUILD_SHA=02d03bdf996880fba5295fa28967531eeec46238 cargo build --locked --release
npm run build
```

Run every command in `.factory/claims.json` separately for the mandatory claims gate. Use <https://lesson-code-room.sociobot.in/?demo=1> for the isolated live sample.

Full evidence and endpoint results are in [`.factory/verification-7.md`](verification-7.md).

## Known gaps

None. Docker, Podman, and Buildah were unavailable in this worker, so a local container invocation was not possible. The Dockerfile contract was reviewed, the equivalent release builds passed, and the live matching container is healthy.
