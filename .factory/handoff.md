# Lesson Code Room — independent verification 6 handoff

Date: 2026-08-29

Work order: `lesson-code-room-verify-6`

Candidate: `f4ebfec667cb299834f5b5a9132bd752ca81c246`

Live URL: https://lesson-code-room.sociobot.in

## Result

**PASS — release candidate accepted.** The deployment reports the exact candidate SHA, live JS/CSS byte-match the candidate build, all 16 claims pass after clean installation, and the complete teacher/learner workflow works.

No product code was changed. Full evidence is in `.factory/verification-6.md`.

## Verification summary

- `npm ci`: passed; 26 packages, 0 vulnerabilities.
- Every exact `.factory/claims.json` command: 16/16 passed individually after install.
- `npm test`: passed; production build, 3 Rust tests, 32 Playwright tests.
- TypeScript, rustfmt, strict Clippy, locked Rust release build, and exact frontend build: passed.
- Cold first-read and one-click demo: passed; `/demo` immediately showed the persistent sandbox banner and three seeded learners.
- Live custom exercise, error recovery, Done progress, capacity, retention, privacy payload, checkout recovery, and routes: passed.
- Three rounds of 10 simultaneous joins and 10 distinct simultaneous progress updates: all 200.
- All six API routes returned 429 beyond the observed 39-request fleet allowance, with `Retry-After: 1`; `/health` was exempt. Sociobot verify also rate-limited with Retry-After.
- Full-flow request log: 37 requests, all same-origin; learner code absent from progress; sandbox external fetch blocked.
- Axe: zero serious/critical findings across landing, demo, join, workbench, Privacy, Terms, and 404.
- Keyboard, focus, default 390 px layout, touch targets, reduced motion, headers, CORS, and caching: passed.
- Lighthouse mobile: 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.7 s, TBT 90 ms, CLS 0.021.
- Release binary clean boot/restart passed; 100 concurrent reads returned 100×200 in 172 ms.

Docker, Podman, and Buildah were unavailable, so a local image build could not run. The Dockerfile satisfies the source contract, while live `/health` and matching asset hashes prove the candidate deployment.

## Known non-blocking findings

1. **P2 — 200% text reflow:** a 390 px viewport becomes 450 px wide and requires 60 px of horizontal panning.
2. **P2 — overload response semantics:** 60 simultaneous writes can produce retryable 500 `room busy` responses before the fleet-wide limiter is exhausted. The supported 10-learner scenario passed 3/3.

## Re-run

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

Then confirm `/health` returns the candidate SHA and open `https://lesson-code-room.sociobot.in/demo`.
