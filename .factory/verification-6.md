# Independent verification 6 — PASS

Date: 2026-08-29

Work order: `lesson-code-room-verify-6`

Candidate: `f4ebfec667cb299834f5b5a9132bd752ca81c246`

Live URL: https://lesson-code-room.sociobot.in

## Verdict

**PASS — the candidate is fit to release.** The deployment reports the exact candidate SHA, live frontend assets byte-match the candidate build, all 16 claims pass after clean installation, and the teacher/learner workflow works on desktop and mobile.

There are no P0 or P1 findings. Two P2 findings remain: 200% text introduces 60 px of horizontal panning at 390 px, and overload beyond a free room's supported 10 learners can return retryable HTTP 500 `room busy` responses. Neither reproduced in three rounds of the required 10-learner scenario.

No product code was changed.

## Required first gates

### Claims gate — PASS (16/16)

`.factory/claims.json` exists and contains 16 valid entries. Each ID maps to exactly one `@claim:<id>` test. After `npm ci`, every exact `test` command ran separately against local `/demo` and exited 0. Logs: `/tmp/lesson-code-room-claims/<id>.log`.

| Claim | Result |
| --- | --- |
| `anonymous-room` | PASS |
| `custom-room` | PASS |
| `sandbox-run` | PASS |
| `demo-reset` | PASS |
| `learner-reset` | PASS |
| `privacy-code` | PASS |
| `teacher-report-limits` | PASS |
| `product-scope` | PASS |
| `no-tracking` | PASS |
| `session-storage` | PASS |
| `offline-preview` | PASS |
| `rate-limit` | PASS |
| `free-capacity` | PASS |
| `room-retention` | PASS |
| `demo-retention` | PASS |
| `paid-checkout` | PASS |

For transparency, a literal pre-bootstrap probe was made before installation. The first command could not launch because `node_modules/.bin/vite` did not exist (`exit 127`); no claim assertion ran. `npm ci` then installed locked dependencies with zero vulnerabilities, after which all 16 exact commands passed. This is an environment bootstrap result, not a failed product claim.

Landing, legal, demo, workbench, and README claims were cross-checked against the inventory. The annotation audit passed; no material visitor claim was found outside `.factory/claims.json`.

### Cold first-read — PASS

A fresh 1440×900 context loaded `/` with HTTP 200 and no console/page errors. The first viewport says:

- What: **Run one coding exercise together**.
- For whom: **For remote teachers who need learners coding now, with clear progress and no student accounts.**
- First click: **Try it with sample data**, beside **A sample room opens with three learners.**

One click reached `/demo`. It immediately showed **Demo — sample data, nothing is saved**, Reset demo, Start for real, an editable sample room, and Moss Finch, Blue Comet, and Quiet Fox. Screenshot: `/tmp/tmp.lUHpWSGczt/live-demo-one-click.png`.

## Clean checkout and quality gates

| Check | Result |
| --- | --- |
| Candidate | PASS — clean start at the requested SHA. |
| Install | PASS — `npm ci`; 26 packages, 0 vulnerabilities. |
| Full suite | PASS — `npm test`; Vite build, 3 Rust tests, 32/32 Playwright tests in 59.5 s. |
| Claim commands | PASS — 16/16 individually. |
| Type check | PASS — `npx tsc -p frontend/tsconfig.json --noEmit`. |
| Formatting | PASS — `cargo fmt --all -- --check`. |
| Lint | PASS — strict Clippy with `-D warnings`. |
| Release build | PASS — `cargo build --locked --release`. |
| Frontend build | PASS — `npm run build`; `dist/` produced. |
| Docker build | Not run: Docker, Podman, and Buildah are unavailable. Source review confirms `rust:1-slim`, `ARG BUILD_SHA=dev`, multi-stage/non-root runtime, no `.git`, `PORT=8080`, and `/health` identity. |

The release binary started in a fresh directory with only `PATH` and `PORT=4201`. `/health` returned `{"build_sha":"dev","ok":true}`. A room survived a graceful stop/restart, proving local persistence. Startup emitted structured JSON and selected the local SQLite fallback.

## Deployment identity

- `/health`: `{"build_sha":"f4ebfec667cb299834f5b5a9132bd752ca81c246","ok":true}`.
- Live JS SHA-256 `82ac516180ad68211a858f80be7d2c8ef567a4e157c61f805b9b49b403e387a0`, exactly matching local `dist/`.
- Live CSS SHA-256 `5f139897a40c3a272662eb51d2a9b268024c24675e9a9493e8d218c47f4c8c2a`, exactly matching local `dist/`.

## Live product exercise

### Main journey and recovery

A teacher created **Build a live status badge** with custom HTML/CSS/JS. A second page joined as **QA Copper Wren**, received exact starter files, rendered **Starter ran**, and appeared as **Ran code**. An intentional JavaScript exception showed **Fix the code and run again**. Corrected code rendered **Recovered** and advanced the teacher view to **Done**.

Progress bodies contained only `learner_token` and `status`. No learner code was sent. Top-level pages had no console/page errors; the intentional sandbox error stayed isolated.

### Boundaries and concurrency

The live API rejected blank/81-character titles, 601-character instructions, 50,001-byte HTML, blank/25-character learner names, invalid progress, bad learner token, and bad teacher token with specific 400/403 responses. Lowercase room lookup returned 200. Retention was exactly 86,400 seconds.

Twelve simultaneous free-room joins produced 10×200 and 2×409. Twelve parallel reads returned 12×200. In three fresh rounds, 10 simultaneous joins returned 10×200 and 10 distinct simultaneous progress updates returned 10×200. A local release load smoke returned 100×200 concurrent reads in 172 ms.

### Billing

- **Buy Room Plus** targets only the Sociobot checkout and returned 303 to `checkout.dodopayments.com`; no purchase was made.
- An invalid restored license showed a clear inactive message and stored no token.
- The recorded-valid local fixture proved capacity 30, 30 successful joins, and a 31st `409 room_full`.

Sign-in is not required. AI is not part of the brief and no missed AI leverage was found.

## Privacy and security

A fresh full live flow recorded 37 requests across landing, Privacy, demo, join, edit, and run. All were same-origin. A sandbox fetch to `https://example.com/must-not-leave` never appeared. The learner-code marker was absent from progress; only `learner_token` and `status` were sent. The learner key existed only in `sessionStorage`, not `localStorage`.

Responses include CSP with `frame-ancestors 'none'`, `nosniff`, strict referrer policy, frame denial, and camera/microphone/geolocation denial. The sandbox uses `connect-src 'none'` and `SAMEORIGIN`. Hostile-origin preflight returned 405 without allow-origin. APIs are `no-store`; hashed JS/CSS are one-year immutable; the unversioned hero is not immutable.

## Rate limits

Each product API route received 60 simultaneous requests after clearing the window:

| Endpoint | Non-429 | 429 | Retry-After |
| --- | ---: | ---: | --- |
| `POST /api/demo` | 39 | 21 | `1` on all |
| `POST /api/rooms` | 39 | 21 | `1` on all |
| `GET /api/rooms/:id` | 39 | 21 | `1` on all |
| `POST /api/rooms/:id/join` | 39 | 21 | `1` on all |
| `GET /api/rooms/:id/progress` | 39 | 21 | `1` on all |
| `POST /api/rooms/:id/progress` | 39 | 21 | `1` on all |

Observed allowance: 13 requests/second per replica and 39 across three replicas. `/health` was exempt (60×200). Sociobot verify returned 17 ordinary responses and 63×429; every 429 had `Retry-After: 1` or `2`.

## Accessibility, mobile, and keyboard

- Factory `verify-url.sh`: PASS in 627 ms; correct title/lang, one H1/main, no browser errors, missing alt, or unlabeled buttons.
- Axe: zero serious/critical issues on landing, demo, join, workbench, Privacy, Terms, and 404.
- Default 390×844 layout: zero horizontal overflow; first-read content and CTA above the fold.
- Keyboard-only skip, join, tabs, run, and reset paths worked. Enter, Space, and tab arrows worked.
- Focus: visible 3 px amber outline (`rgb(255, 200, 87)`).
- Reduced motion: maximum duration 0.01 ms.
- Touch targets met 44 px baseline.

See the P2 text-reflow finding below.

## Performance and delivery

| Metric | Result |
| --- | ---: |
| Lighthouse Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 1.5 s |
| LCP | 1.7 s |
| TBT | 90 ms |
| CLS | 0.021 |

No Lighthouse warnings. Assets: JS 29.02 KB raw / 9.41 KB gzip, CSS 17.85 KB / 4.75 KB gzip, fonts 71.35 KB, mobile hero 22.32 KB, desktop hero 55.34 KB. No third-party runtime fonts/scripts loaded.

All declared routes, robots, sitemap, and sandbox return 200; unknown paths return designed HTTP 404. Internal links return 200. Metadata and social assets are present.

This is not a PWA, library, CLI, or sign-in product. Those checks are not applicable. The loaded workbench offline-preview claim passed.

## Findings

### P2 — 200% text causes horizontal panning

At 390×844 with root text at 200%, the document becomes 450 px wide. The Privacy nav link, H1, audience sentence, CTA, facts, art, and limits copy extend beyond the right edge. Content remains reachable, but clean single-axis reflow fails.

Recommended repair: prevent rem-scaled padding/grid minimums from widening the layout and add a 200% text regression at 390 px.

### P2 — overload contention returns HTTP 500

Three 60-request overload rounds produced:

| Round | Join | Same-learner progress |
| --- | --- | --- |
| 1 | 10×200, 23×409, 21×429, **6×500** | 33×200, 21×429, **6×500** |
| 2 | 10×200, 23×409, 21×429, **6×500** | 36×200, 21×429, **3×500** |
| 3 | 10×200, 21×409, 21×429, **8×500** | 30×200, 21×429, **9×500** |

Every 500 body was `{"error":"server_error","message":"The room is busy. Try again."}`. Limiting still worked, and the supported 10-distinct-learner scenario passed 3/3. This is non-blocking overload/error-semantics debt.

Recommended repair: map known lease contention to 409 or 503 with `Retry-After`, or retry briefly server-side.

## Release decision

**PASS.** The candidate meets the brief and mandatory release gates. Schedule the two P2 findings; neither blocks the 10-learner scope.
