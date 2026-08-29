# Independent verification 5 — FAIL

Date: 2026-08-29

Work order: `lesson-code-room-verify-5`

Candidate: `2f1abc3924bd1d7fefef9530757b4173c9e093de`

Live URL: https://lesson-code-room.sociobot.in

## Verdict

**FAIL — do not release.** The deployed build is the requested candidate, all 16 declared claim commands pass, and the main teacher/learner workflow works. Release is still blocked by a reproducible browser-history race, a claim test that does not exercise the paid capacity it promises, and a Dockerfile that violates the mandatory Rust image contract.

No product code was changed during this verification.

## Release-blocking findings

### P1 — an unfinished route load can overwrite a later Back navigation

The SPA does not cancel or invalidate an asynchronous route render when browser history changes. After creating a room, the URL changes to `/teach/<room>#teacher=<token>` before `teacherPage()` finishes fetching the room. If the teacher selects Back during that request, the home route renders and is then overwritten by the stale teacher response.

Fresh live evidence:

- In three unthrottled create-and-immediate-Back attempts, two ended at URL `/` while showing the private teacher page.
- With the live room GET delayed by 1.5 seconds in Playwright, the failure was deterministic: final URL `/`, title `Teach — Lesson Code Room`, H1 `Delayed back proof`, one learner-link field, and no create form.
- At the moment the `/teach/...` URL first appeared, the old landing H1/title were still present, confirming the navigation and render are not committed atomically.

This violates the routing acceptance contract that Back/Forward restore the correct state. It can leave a public-looking home URL displaying a private teacher view. Add a navigation generation/abort check before any async route commits its DOM, then test delayed `/api/rooms/:id` and `/api/demo` responses with immediate Back/forward navigation.

### P1 — the paid-capacity claim test does not prove the claimed outcome

`paid-checkout` claims that a $29 Room Plus license raises new rooms to 30 learners. Its tagged test follows the real checkout redirect, mocks the browser verification response, and checks local storage plus the “30 learners” status copy. It never creates a room through the backend with a recorded-valid license response and never asserts `capacity === 30` or a 30-learner join boundary.

The claim test therefore repeats the promise without demonstrating the promised paid behavior. The claims contract requires the observable outcome, not only the presence of UI copy. Add a backend billing fixture, create a licensed room, and assert 30 joins succeed and the 31st is rejected.

### P1 — Dockerfile pins an obsolete Rust minor against the mandatory build contract

`Dockerfile` uses `FROM rust:1.89-bookworm AS rust-builder`. The supplied backend contract explicitly requires `rust:1-slim` or `rust:1-alpine` and says never to pin a Rust minor. The verifier host is Rust 1.98.0; current locked dependencies report a maximum declared MSRV of 1.88, so the pin happens to be sufficient today, but it is nine stable releases behind the verified toolchain and can break on the next lockfile refresh.

No Docker-compatible engine is installed in this container, so an image build could not be executed. The source-level contract violation is unambiguous and release-blocking independently of that limitation.

## Other findings

### P2 — the privacy email link misses the 44 px touch-target baseline

At a 390×844 viewport, `privacy@sociobot.in` measures 149×21 CSS px. All other measured links, buttons, inputs, textareas, and editor tabs across landing, demo, join, workbench, Privacy, and Terms meet 44×44 px. Give this inline link a minimum 44 px hit area.

### P2 — README describes the wrong forwarded-address selection

`README.md` says API routes limit by “the first valid `X-Forwarded-For` address.” `src/main.rs` intentionally uses the right-most valid address because the ingress appends the trusted client address. The implementation and live spoof-resistance test are correct; the security documentation is stale.

## Required first gates

### Claims gate — PASS for all listed commands (16/16)

The checkout started clean at the exact candidate. `npm ci` installed 26 packages with zero audit findings. `.factory/claims.json` exists. Every listed command was then run separately through the local `/demo` entry point and exited 0:

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
| `paid-checkout` | PASS as written; incomplete for the 30-learner outcome described above |

Each ID has exactly one tagged Playwright test. Landing, legal, workbench, and README copy were cross-checked against the inventory; the material issue is the incomplete paid outcome assertion, not a missing JSON file or duplicate tag.

### Cold first-read — PASS

A fresh 1440×900 context loaded `/` with HTTP 200 and no console/page errors. The first viewport says:

- What: **Run one coding exercise together**.
- For whom: **For remote teachers who need learners coding now, with clear progress and no student accounts.**
- First click: **Try it with sample data**, with “A sample room opens with three learners.”

At 390×844, the headline, audience sentence, action, and adjacent explanation all fit above the fold; the action ends at 623 px. One click reaches `/demo`, shows the persistent “Demo — sample data, nothing is saved” banner, then a populated teacher room with Moss Finch, Blue Comet, and Quiet Fox.

## Local quality and runtime evidence

| Check | Result |
| --- | --- |
| Clean install | `npm ci` passed; 26 packages, 0 vulnerabilities. |
| Full suite | `npm test` passed: production build, 3 Rust tests, 30/30 Playwright tests. |
| TypeScript | `npx tsc --noEmit -p frontend/tsconfig.json` passed. |
| Formatting | `cargo fmt --all -- --check` passed. |
| Lint | `cargo clippy --all-targets --all-features -- -D warnings` passed. |
| Release build | `cargo build --locked --release` passed. |
| Exact frontend build | `npm run build` passed and produced `dist/`. |
| No-config boot | Release binary started in a fresh directory with only `PATH` and `PORT=4189`; `/health` returned `{"build_sha":"dev","ok":true}` and startup logged the local SQLite fallback. |
| Local persistence | Room `SCETNH` remained readable after stopping and restarting that no-config process. |
| Load smoke | 100 concurrent local room reads with distinct limiter identities returned 100×200 in 184 ms. |

Production output is well inside the budgets: JS 28.59 KB raw / 9.32 KB gzip, CSS 17.74 KB raw / 4.73 KB gzip, fonts 71.35 KB total, mobile hero 22.32 KB, desktop hero 55.34 KB.

## Live deployment evidence

| Area | Result / evidence |
| --- | --- |
| Build identity | PASS. `/health` returned the exact candidate SHA. Live JS `index-zPOtIOnd.js` and CSS `index-dsUHiIZK.css` SHA-256 hashes exactly match local `dist/`. |
| Real custom-room journey | PASS. A teacher created “Build a status badge” with custom HTML/CSS/JS. A separate learner context received all three exact starter files, ran them, rendered “Starter ran,” and appeared as `Ran code` in the teacher view. No console/page errors occurred. |
| Demo regressions | PASS. Reset changed room `LNSJPW` to `BZWGFL`; after four seconds the old-room learner count was zero. Demo identity, Reset demo, and Start for real remained visible on teacher, join, and workbench views. |
| Editing and recovery | PASS. HTML/CSS/JS ran in the sandbox; starter reset restored the original preview; an offline edit rendered with the offline notice and no HTTP request; a deliberate JavaScript exception showed “Fix the code and run again” and did not claim Ran code. |
| Progress/privacy | PASS. Done remained Done after another run. Progress POST bodies contained only `learner_token` and `status`; page requests through the normal demo flow were same-origin only. A request to `https://example.com/live-qa` from learner code never left the sandbox. Hostile learner-name markup rendered as escaped text, not an element. |
| Boundaries | PASS. Blank/81-character titles, 601-character instructions, 50,001-byte HTML, blank/25-character names, invalid progress, bad learner token, and bad teacher token returned specific 400/403 responses. Lowercase room lookup returned 200. |
| Capacity/concurrency | PASS. Twelve simultaneous joins to a fresh free room produced 10×200 and 2×409. |
| Product API limits | PASS. Every API route produced 429 under a 48-request burst and every 429 had `Retry-After: 1`. Two active replicas allowed 26 ordinary requests; three allowed 39. The configured allowance is 13 requests/second per replica and at most 39 across the three-replica fleet. Rotating caller-supplied `X-Forwarded-For` values still produced 39×200 and 9×429. `/health` was correctly exempt (48×200). |
| Billing API limit | PASS. 80 concurrent invalid-license verifies produced 30×200 and 50×429; every 429 had `Retry-After: 4`. Successful invalid verdicts were `no-store` and CORS allowed only the product origin tested. |
| Checkout | PASS. The live Room Plus checkout returns HTTP 303 to `checkout.dodopayments.com`; invalid-license recovery shows a clear message and stores no license token. No purchase was made. |
| Headers and CORS | PASS. Product responses include CSP, `nosniff`, strict referrer policy, frame denial, and camera/microphone/geolocation denial. The sandbox uses `SAMEORIGIN` plus `connect-src 'none'`. A hostile-origin API preflight returned 405 with no allow-origin header. |
| Caching | PASS. APIs return `Cache-Control: no-store`; content-hashed JS/CSS return one-year immutable caching; unversioned hero/social images do not. |
| Accessibility | PASS apart from the P2 target above. `/opt/fleet/lib/verify-url.sh` passed in 629 ms. Axe found zero serious/critical issues on landing, demo, join, workbench, Privacy, Terms, and the real HTTP 404. All pages have `lang=en`, a title, one H1, and a main landmark. |
| Keyboard/mobile/motion | Keyboard join, form validation/focus, tab arrow navigation, reset confirmation, and visible 3 px amber focus passed. Default 390 px layouts had no horizontal overflow. Reduced motion changed animation/transition duration to 0.01 ms and scrolling to `auto`. At 200% root text size, functions remained present but the page required 60 px of horizontal scrolling. |
| Performance | Fresh mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.5 s, LCP 1.7 s, TBT 0 ms, CLS 0.021, no run warnings. |
| Routes/links | `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and `/sandbox.html` return 200; an unknown path returns a designed 404. Internal links return 200, the checkout returns 303, and the factory link returns 200. |
| PWA/library/sign-in | Not applicable. This is not a PWA, library/CLI, or sign-in product. |

## Retest gate

1. Cancel or invalidate stale async route renders and add delayed-response Back/forward tests.
2. Exercise the entire Room Plus claim with a recorded-valid backend billing fixture and the 30/31 learner boundary.
3. Replace the pinned Rust builder image with the required rolling stable image.
4. Enlarge the privacy email hit area and correct the README’s forwarded-address wording.
5. Re-run every claim command, the full suite, container build, and the live verification against the new SHA.
