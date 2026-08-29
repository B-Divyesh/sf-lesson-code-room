# Independent verification 7 — PASS

Date: 2026-08-29

Work order: `lesson-code-room-verify-7`

Candidate: `02d03bdf996880fba5295fa28967531eeec46238`

Live URL: <https://lesson-code-room.sociobot.in>

## Verdict

**PASS — the candidate is fit to release.** The live backend reports the exact candidate SHA, the live JS and CSS byte-match the local production build, every declared claim passes, and the complete teacher-to-learner job works on desktop and mobile.

No P0, P1, P2, or P3 product defects were found. Product code was not changed.

## Mandatory first gates

### Claims gate — PASS (16/16)

`.factory/claims.json` exists. After `npm ci`, every exact listed command ran separately against the shipped local demo entry point and exited 0:

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

For transparency, the commands were first invoked literally before dependency installation. Each stopped at `vite: not found`; no claim assertion ran. `npm ci` then installed the locked 26 packages with zero vulnerabilities, and all 16 commands passed. This was clone bootstrap evidence, not a failed product behavior.

Landing, demo, legal, and README promises were cross-checked with the claim inventory. All material visitor-reliance claims are inventoried and tested; no unlisted product claim was found.

### Cold first-read — PASS

A fresh 1440×900 browser opened `/` with HTTP 200 and no console or page errors. The first screen answers:

- What: **Run one coding exercise together**.
- For whom: **For remote teachers who need learners coding now, with clear progress and no student accounts.**
- First click: **Try it with sample data**, beside **A sample room opens with three learners.**

The first screen also gives the three required facts: no student accounts, 24-hour rooms, and free capacity for 10 learners. One click reached `/?demo=1` in 1.45 seconds and showed the persistent demo banner, Reset demo, Start for real, the sample exercise, and Moss Finch, Blue Comet, and Quiet Fox. Evidence: `/tmp/lesson-code-room-first-read.png` and `/tmp/lcr-verify7-one-click-demo.png`.

## Clean checkout and build gates

| Check | Result |
| --- | --- |
| Checkout | PASS — clean start at the exact requested SHA. |
| Install | PASS — `npm ci`; 26 packages, 0 vulnerabilities. |
| Full suite | PASS — `npm test`; 3 Rust tests and 35/35 Playwright tests. |
| Type check | PASS — `npx tsc -p frontend/tsconfig.json --noEmit`. |
| Formatting | PASS — `cargo fmt --all -- --check`. |
| Lint | PASS — `cargo clippy --all-targets --all-features -- -D warnings`. |
| Release build | PASS — `cargo build --locked --release`. |
| Candidate-identity build | PASS — release rebuilt with `BUILD_SHA=02d03b…`; `/health` returned the full SHA. |
| Frontend production build | PASS — `npm run build`; `dist/` produced. |
| Docker invocation | Not run: Docker, Podman, and Buildah are unavailable in this worker. The required stages/base image, build arg, non-root runtime, port, and source layout were reviewed; the matching live container is healthy. |

The release binary started in a fresh directory with only `PATH` and `PORT`. It selected the documented local SQLite fallback, logged structured JSON, and served the product. A created room remained available after a graceful stop/restart.

## Deployment identity

- Live `/health`: `{"build_sha":"02d03bdf996880fba5295fa28967531eeec46238","ok":true}`.
- Live JS SHA-256: `bb891b8a4b2cc3979f75e17bc3aef8f026ae436dd74f4033a9f1d02ad1afa599`, exactly matching local `dist/`.
- Live CSS SHA-256: `03481033035e51a85fb13199abd700ac4e6050839a0b3f105b1b8a63f3df432a`, exactly matching local `dist/`.

The earlier deployment-only failure is not present.

## End-to-end product exercise

A teacher created **Build a live QA badge** with custom HTML, CSS, and JavaScript. A separate learner page joined anonymously as **QA Copper Wren**, received the exact starter files, rendered **Starter ran**, and appeared on the teacher board. A deliberate JavaScript exception showed the actionable failure and did not claim successful progress. Corrected code rendered **Recovered**; marking Done updated the teacher to **QA Copper Wren — Done**.

The one-click demo retained its banner through teacher, join, and workbench views. Reset, offline preview, starter reset, monotonic Done state, and browser Back/Forward behavior pass in the full suite. Evidence: `/tmp/lcr-verify7-live-workbench.png`, `/tmp/lcr-verify7-keyboard-mobile.png`, and `/tmp/lcr-verify7-demo-preview-viewport.png`.

### Boundaries and recovery

- Exact maxima were accepted: 80-character title, 600-character instructions, 50,000-byte HTML/CSS/JavaScript, and 24-character learner name.
- Blank/81-character titles, 601-character instructions, 50,001-byte HTML, and 25-character learner names returned specific 400 responses.
- Invalid progress returned 400; bad learner and teacher tokens returned 403; lowercase room codes worked.
- A free room accepted exactly 10 learners and returned 409 for the eleventh.
- Live-room retention measured exactly 86,400 seconds; demo retention is covered by its claim test.

## Backend, persistence, and rate limits

Three fresh live concurrency rounds each produced 10/10 successful joins, 10 distinct tokens, 10/10 successful progress writes, and a teacher report of 10 Ran code learners. A local release load smoke completed 100/100 concurrent reads in 144 ms (about 694 requests/second) using distinct test client identities.

Every product endpoint was independently burst-tested from one live client:

| Endpoint | Ordinary responses | 429 | Retry-After |
| --- | ---: | ---: | --- |
| `POST /api/demo` | 13 | 47 | `1` on all |
| `POST /api/rooms` | 13 | 47 | `1` on all |
| `GET /api/rooms/:id` | 13 | 47 | `1` on all |
| `POST /api/rooms/:id/join` | 13 (10×200, 3×409) | 47 | `1` on all |
| `GET /api/rooms/:id/progress` | 13 | 47 | `1` on all |
| `POST /api/rooms/:id/progress` | 13 | 47 | `1` on all |

Observed allowance: **13 requests per one-second window for this client path**. Rotating caller-supplied `X-Forwarded-For` values did not evade it. `/health` is exempt and returned 60/60 successful responses.

The Sociobot license verification endpoint admitted 30 of 80 concurrent invalid-license checks, then returned 50×429. Every 429 included `Retry-After: 4`.

## Privacy, billing, and security

A fresh live landing → create → join → edit → run → Done flow recorded only product-origin HTTP(S) requests. The intentional sandbox fetch to `example.com` was blocked by `connect-src 'none'` and never left the page. Progress bodies contained only `learner_token` and `status`; learner code was absent. The learner key appeared only in its current tab's `sessionStorage`; a second tab had no key and showed the join form.

Normal pages and APIs include `nosniff`, strict referrer policy, frame denial, camera/microphone/geolocation denial, and the declared CSP. The sandbox uses `SAMEORIGIN`, `connect-src 'none'`, and restrictive form/media/font/base policies. A hostile-origin preflight returned 405 with no allow-origin header. APIs are `no-store`; content-hashed assets are one-year immutable.

**Buy Room Plus** targets only the Sociobot checkout, which returned 303 to its hosted Dodo checkout. An invalid restored license produced a clear recovery message and stored no license token. The recorded-valid local claim fixture proves 30 successful joins and a 31st `409 room_full`. No purchase was made.

No sign-in is required. AI, repository import, sync, service worker, library packaging, and CLI packaging are outside this product's brief and artifact class.

## Accessibility, structure, mobile, and keyboard

- Factory `verify-url.sh`: PASS in 1,207 ms at `/?demo=1`; correct title/lang, one H1/main, alt text, named buttons, and zero browser errors. Evidence: `/tmp/lcr-verify7-url.iiOisF/`.
- Axe: zero serious/critical findings on landing, demo, Privacy, Terms, and the real 404. The local suite additionally covers join and workbench.
- At 390×844, the primary action ends at 611 px and is above the fold. Default and 200% text both measure `scrollWidth = clientWidth = 390`.
- Keyboard-only name entry, join, tab ArrowRight navigation, Run with Space, and Done with Enter succeeded. The skip link bypassed navigation to the primary action.
- Focus uses a visible 3 px amber outline. All tested visible interactive targets on landing, demo, Privacy, and Terms meet 44 px.
- Reduced-motion mode caps transitions at 0.01 ms. No looping motion or flashing is present.
- Routes have `lang=en`, one H1, a main landmark, ordered headings, labels, live status/error regions, route-specific metadata, and a designed HTTP 404.

## Performance and delivery

Fresh mobile Lighthouse:

| Metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| FCP | 1.5 s |
| LCP | 1.7 s |
| Total blocking time | 0 ms |
| CLS | 0.001 |
| Speed Index | 1.5 s |

There were no Lighthouse warnings. Reports: `/tmp/lcr-verify7-lighthouse.json` and `/tmp/lcr-verify7-lighthouse-quality.json`.

Build payloads are below budget: JS 31.00 KB raw / 9.72 KB gzip; CSS 18.92 KB / 4.95 KB gzip; fonts 71.35 KB; mobile hero 22.32 KB; desktop hero 55.34 KB. No third-party font or script loads at runtime.

All declared routes, robots, sitemap, sandbox, and internal links resolve as intended. Unknown routes return the designed HTTP 404. Checkout returns its expected hosted redirect.

## Findings

None.

## Release decision

**PASS.** Candidate `02d03bdf996880fba5295fa28967531eeec46238` meets the researched brief and release contract at <https://lesson-code-room.sociobot.in>.
