# Independent verification 2 — FAIL

Date: 2026-08-28  
Work order: `lesson-code-room-verify-2`  
Candidate and deployed build: `59bf766a8e9fb9edcbda057186370cb56b1f4088`  
Live URL: https://lesson-code-room.sociobot.in

## Verdict

**FAIL — release blocked by an incomplete claims inventory.**

The previous deployment-only P0 is fixed: fresh live evidence confirms that the deployed backend shares rooms across requests and that the complete teacher-to-learner flow works. All declared claim tests and the full suite pass. However, the visitor-facing privacy, retention, and payment promises below do not have entries and observable demo tests in `.factory/claims.json`. The claims acceptance contract explicitly makes an unlisted claim a finding that fails review until the copy is removed or a test is added.

## First-read test — PASS

Fresh cold visit to `/` rendered, with no console errors:

- **What:** “Run one coding exercise together.”
- **For whom:** “For remote teachers who need learners coding now, with clear progress and no student accounts.”
- **First click:** the visible **Try it with sample data** action; adjacent copy says that it opens a sample room with three learners.

The first screen therefore answers the required three questions in plain words, and the demo opens in one click.

## Release-blocking finding

### P1 — visitor-reliance claims are not fully listed or sandbox-tested

`claims.json` has eight well-formed entries, each with one tagged test, but it does not inventory all promises a visitor can rely on. Examples published on the landing/legal pages include:

- “They do not see typing, tabs, cameras, or private learner code” and “We do not use advertising trackers” (`frontend/src/main.ts`, landing and `/privacy`). `privacy-code` tests that the submitted code marker is absent from a progress request; it does not test the broader surveillance/tracker promises.
- “Expired room data is deleted during normal server cleanup” (`/privacy`). `room-retention` and `demo-retention` test the expiry timestamps, not observable deletion after cleanup.
- “Payment card details never reach Lesson Code Room” (`/privacy`). `paid-checkout` tests the hosted checkout target and recorded license verification, not this data-flow promise.
- “No grading or hidden activity reports” and “No repositories or video calls” (`/`). These product-limit promises have no claims entry/test.

Required disposition: add narrowly scoped claim entries and observable demo tests for every retained promise, or remove/narrow the unsupported copy. This is a documentation/test-contract issue, not a reproduction of the prior production storage failure.

## Claims gate — PASS for all declared claims

From the clean candidate checkout, after `npm ci`, I ran every exact command in `.factory/claims.json`; each command runs through the local production server and its `/demo` entry point.

| Claim ID | Result |
| --- | --- |
| `anonymous-room` | PASS |
| `sandbox-run` | PASS |
| `demo-reset` | PASS |
| `privacy-code` | PASS |
| `free-capacity` | PASS |
| `room-retention` | PASS |
| `demo-retention` | PASS |
| `paid-checkout` | PASS |

`npm test` also passed: production Vite build, 2 Rust unit tests, and 13 Playwright tests.

## Fresh functional and deployment evidence

| Area | Result / evidence |
| --- | --- |
| Deployment identity | `GET /health` returned `{"build_sha":"59bf766a8e9fb9edcbda057186370cb56b1f4088","ok":true}`. Live HTML references the same built JS/CSS hashes as the candidate: `index-BBeU5N0A.js` and `index-BLQjfvdB.css`. |
| Former P0 regression | Fresh browser `/demo` opened a sample teacher room; the displayed learner link opened the account-free join page. A learner joined, ran the preview, and received `Teacher can see: Ran code`. A live API flow also created room `ACMKPE`, accepted 10 joins, returned the 11th as `409 room_full`, and reported 10 persisted participants. |
| Invalid/recovery paths | Blank room title: `400 invalid_room`; 25-character screen name: `400 invalid_name`; invalid progress state: `400 invalid_status`; valid progress update: `200` and teacher counts changed. |
| Sandbox/privacy | Live learner editing with marker `PRIVATE_LIVE_QA_77` did not include it in the progress request. A sandbox attempt to fetch `https://example.com/leak` made no outgoing request; its own restrictive CSP blocked it. The CSP warning from that deliberately injected malicious code is expected, not an ordinary page error. |
| Demo isolation UX | `/demo` shows “Demo — sample data, nothing is saved”, Reset demo, and Start for real; fresh demo data had the documented seeded learner states. |
| Rate limit | Burst of 48 live `POST /api/demo` requests with one forwarded identity produced **40×200 and 8×429**. Each 429 had `Retry-After: 1`; observed limit is 40 requests/second. |
| Backend/runtime | `cargo build --locked --release` passed. The release binary, launched in a fresh temporary working directory with only `PORT=4188`, served `/health` and logged the local SQLite fallback. This satisfies the no-required-env local boot path; live health identifies the candidate. Docker is unavailable in this verifier image, so `docker build` could not be run. |
| Security/response policy | Main responses set CSP, `X-Content-Type-Options: nosniff`, strict referrer policy, frame protection, and camera/microphone/geolocation deny policy. `/sandbox.html` sets `connect-src 'none'`, `form-action 'none'`, no media/fonts, and `X-Frame-Options: SAMEORIGIN`. Cross-origin `OPTIONS /api/demo` received `405` with no permissive CORS headers. |
| Outbound/privacy | Cold landing loaded only same-origin HTML, JS, CSS, image, and self-hosted font assets; no analytics/tracker or third-party page request was observed. No sign-in flow is present. |
| Caching/budgets | Live hashed assets return `Cache-Control: public, max-age=31536000, immutable`. Build output: JS 27.02 KB raw / 8.87 KB gzip; CSS 17.50 KB raw / 4.71 KB gzip; bundled fonts 71.35 KB raw; hero image 55.34 KB raw. All are within the stated budgets. |
| Live browser/a11y | `/opt/fleet/lib/verify-url.sh` passed at `/tmp/lcr-verify-ZfSdOq`: title, `lang=en`, one `h1`, `main`, image alts, named buttons, and no console/page errors. Axe scans of `/`, `/demo`, `/privacy`, and `/terms` found no serious/critical violations. At 390 px, `scrollWidth` was exactly 390 and the primary demo link remained visible. First Tab focuses the skip link; CSS supplies a 3 px focus style and a reduced-motion override. |
| Lighthouse | Mobile Lighthouse report at `/tmp/lcr-lighthouse`: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.5 s, LCP 1.7 s, CLS 0.021, TBT 0 ms. Chrome crashed while Lighthouse attempted its final full-page screenshot after the audits, so the CLI exited nonzero even though the saved report has no run warnings and the measured audit results above. |

## Local quality gates

- `npm ci` — passed, 0 audited vulnerabilities.
- `npm test` — passed (13 Playwright, 2 Rust unit tests).
- `npx tsc --noEmit -p frontend/tsconfig.json` — passed.
- `cargo fmt --check` — passed.
- `cargo clippy --all-targets -- -D warnings` — passed.
- `npm run build` — passed and produced `dist/`.
- `cargo build --locked --release` — passed.

## Retest gate

1. Inventory each retained visitor-reliance claim in `.factory/claims.json`.
2. Add one observable sandbox/demo test per claim (or remove/narrow the copy).
3. Re-run each exact claim command, `npm test`, and the live teacher/learner flow against the deployed SHA.
