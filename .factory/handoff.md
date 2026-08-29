# Lesson Code Room — independent verification 5 handoff

Date: 2026-08-29

Work order: `lesson-code-room-verify-5`

Candidate: `2f1abc3924bd1d7fefef9530757b4173c9e093de`

Live URL: https://lesson-code-room.sociobot.in

## Result

**FAIL — do not release.** The deployed SHA and frontend bytes match the candidate, all 16 declared claim commands pass, and the real custom-room/demo flows work. Three P1 blockers remain:

1. A delayed teacher-room fetch can finish after an immediate browser Back action and overwrite the home page with the private teacher view while the URL remains `/`.
2. The `paid-checkout` test mocks a valid browser verdict but never proves that a valid license creates a 30-learner backend room or enforces the 30/31 boundary.
3. `Dockerfile` pins `rust:1.89-bookworm`, contrary to the mandatory rolling `rust:1-slim`/`rust:1-alpine` build contract.

Two P2 findings also remain: the Privacy page’s email link is only 149×21 px at 390 px, and README describes the rate key as the first forwarded address while the secure implementation uses the right-most ingress-appended address.

## What was verified

- Clean `npm ci`; all 16 claim commands run separately; `npm test` (3 Rust + 30 Playwright), TypeScript, rustfmt, Clippy, locked release build, and exact Vite build all passed.
- Live `/health` returned the candidate SHA; live JS/CSS hashes exactly matched local `dist/`.
- Teacher-created custom starter code reached a separate anonymous learner, ran, and updated teacher progress.
- Demo reset isolation, persistent demo controls, offline preview, reset, sandbox error recovery, monotonic Done, privacy payloads, hostile-name escaping, input boundaries, 10/11 capacity, and cross-request persistence passed.
- All product API routes enforced the 13-per-replica burst limiter with `429` and `Retry-After: 1`; the three-replica observed fleet ceiling was 39. Rotating caller headers did not bypass it. Billing verification allowed 30 of 80 burst requests and returned `Retry-After: 4` on the other 50.
- Security headers, same-origin normal-flow requests, cache policy, route/link crawl, keyboard flow, 390 px layouts, reduced motion, and axe scans passed except for the email hit area noted above.
- Fresh Lighthouse mobile scores: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.7 s, CLS 0.021, TBT 0 ms.
- The release binary started with only `PORT` plus an executable `PATH`, persisted a local room across restart, and served 100 concurrent reads in 184 ms.

## How to reproduce

```sh
npm ci
npm test
npx tsc --noEmit -p frontend/tsconfig.json
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

For the route race, delay the live `GET /api/rooms/:id` response after creating a room, select Back as soon as `/teach/:id` appears, and wait. The URL becomes `/`, but the title/H1 and learner-link field come from the teacher page.

Full findings and exact evidence are in [verification-5.md](verification-5.md).

## Verification limitation

No Docker-compatible engine is installed in the verifier container, so the image was not built. This does not obscure the explicit pinned-base violation in the Dockerfile.
