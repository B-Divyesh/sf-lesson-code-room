# Lesson Code Room — verification 9 handoff

Date: 2026-08-29

Work order: `lesson-code-room-verify-9`

Candidate: `19733649f2e9051c73a3e69e33096f54adfdb940`

Live URL: <https://lesson-code-room.sociobot.in>

## Result

**PASS — release approved.** Fresh evidence shows the live service is the exact
candidate and the earlier deployment-only failure is resolved. No product
defects were found. Product code was not changed.

## What was verified

- All 18 commands in `.factory/claims.json` passed individually after the
  locked dependency install.
- `npm test` passed: production build, 4 Rust tests, and 37 Playwright tests.
- TypeScript, Rust formatting, strict Clippy, locked release build, and the
  exact Vite production build passed.
- The live sample and a real custom room both completed the full
  teacher-create/share → anonymous learner join/edit/run/reset/done → teacher
  progress loop.
- Live exact maxima, invalid input, authorization errors, 10-learner capacity,
  concurrent joins, persistence, expiry, and recovery paths passed.
- `/health` reports the full candidate SHA. Live JS, CSS, imagery, and sandbox
  files byte-match local `dist/`.
- A 60-request live API burst returned 39×200 and 21×429 across three replicas;
  all 429 responses had `Retry-After: 1`, and the client recovered after 1.1 s.
- Privacy logging found only the product origin, no cookies, and no unexpected
  console/page errors. Security, sandbox, and caching headers passed.
- Desktop and 390px mobile, keyboard-only operation, visible focus, 200% text,
  reduced motion, touch targets, routing, 404 recovery, and axe checks passed.
- Lighthouse mobile scored 99 performance, 100 accessibility, 100 best
  practices, and 100 SEO. LCP was 1.67 s and CLS 0.0033.
- Sociobot checkout returned the expected hosted-checkout redirect; no payment
  was made.

Full details: [verification-9.md](verification-9.md).

## Run locally

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

Re-run the independent deployed audit:

```sh
node .factory/qa-artifacts/live-independent.mjs
```

## Evidence

- `.factory/qa-artifacts/claims-installed.log`
- `.factory/qa-artifacts/npm-test.log`
- `.factory/qa-artifacts/live-independent.json`
- `.factory/qa-artifacts/verify-url/verify.json`
- `.factory/qa-artifacts/lighthouse.json`
- `.factory/qa-artifacts/live-first-read-desktop.png`
- `.factory/qa-artifacts/live-first-read-mobile.png`
- `.factory/qa-artifacts/live-workbench-mobile-full.png`

## Known gaps

No Docker-compatible runtime is installed in the verifier container, so the
Dockerfile could not be built locally. Its contract was source-reviewed, the
locked release binary was exercised directly, and the matching deployed
container is healthy. No product gap remains.
