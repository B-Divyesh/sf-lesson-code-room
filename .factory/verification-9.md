# Independent verification 9 — PASS

Date: 2026-08-29

Work order: `lesson-code-room-verify-9`

Candidate: `19733649f2e9051c73a3e69e33096f54adfdb940`

Live URL: <https://lesson-code-room.sociobot.in>

## Verdict

**PASS — the candidate is fit to release.** The live service now identifies
itself as the exact candidate, its frontend assets byte-match the candidate
build, every declared claim passes, and both the sample and real
teacher-to-learner flows work end to end.

No P0, P1, P2, or P3 product defects were found. Product code was not changed.

## Mandatory first gates

### Claims gate — PASS (18/18)

`.factory/claims.json` exists. After `npm ci`, every exact listed command was
run separately through the local production server and demo entry point. All
18 exited 0:

| Claim | Result |
| --- | --- |
| `anonymous-room` | PASS |
| `custom-room` | PASS |
| `sandbox-run` | PASS |
| `demo-reset` | PASS |
| `demo-storage-isolation` | PASS |
| `demo-sample-data` | PASS |
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

Each inventory ID occurs in exactly one `@claim:<id>` test. Landing, legal,
demo, workbench, and README copy were cross-checked against the inventory; no
material visitor-reliance claim was found outside it.

For transparency, the literal pre-install invocation stopped at
`vite: not found`; no claim assertion ran because the clean clone had no
`node_modules`. `npm ci` installed the locked 26 packages with zero audit
findings, after which all exact claim commands passed. This is dependency
bootstrap evidence, not a failed product behavior.

Evidence: [claims-installed.log](qa-artifacts/claims-installed.log).

### Cold first-read — PASS

A fresh 1440×900 and 390×844 Chromium visit answered all three required
questions on the first screen:

- What: **Run one coding exercise together**.
- For whom: **For remote teachers who need learners coding now, with clear
  progress and no student accounts.**
- First action: **Try it with sample data**, beside **A sample room opens with
  three learners.**

The action was visible above the fold in both viewports. One keyboard-activated
click opened a populated room with Moss Finch — Done, Blue Comet — Ran code,
and Quiet Fox — Joined. The demo banner, Reset demo, and Start for real stayed
present through teacher, join, and workbench views.

Screenshots: [desktop](qa-artifacts/live-first-read-desktop.png),
[mobile](qa-artifacts/live-first-read-mobile.png), and
[demo](qa-artifacts/live-demo-mobile-full.png).

## Clean checkout and build gates

| Check | Result |
| --- | --- |
| Checkout | PASS — started clean at the requested commit. |
| Install | PASS — `npm ci`; 26 packages, 0 vulnerabilities. |
| Full suite | PASS — `npm test`; Vite build, 4/4 Rust tests, 37/37 Playwright tests. |
| Claim commands | PASS — all 18 commands separately. |
| Type check | PASS — `npx tsc -p frontend/tsconfig.json --noEmit`. |
| Format | PASS — `cargo fmt --all -- --check`. |
| Lint | PASS — `cargo clippy --all-targets --all-features -- -D warnings`. |
| Release build | PASS — `cargo build --locked --release`. |
| Exact frontend build | PASS — `npm run build` produced `dist/`. |
| Runtime defaults | PASS — release binary started in a fresh directory with only `PORT` relevant, selected local SQLite, logged structured configuration, and served `/health`. |
| Restart persistence | PASS — local room `TPUKEY` remained readable after graceful stop/restart. |
| Container image | Not run — Docker, Podman, and Buildah are unavailable. Source review passes: multi-stage, `rust:1-slim`, `ARG BUILD_SHA=dev`, no `.git`, non-root runtime, `PORT=8080`. |

Build output:

- JavaScript: 31.00 kB raw / 9.72 kB gzip.
- CSS: 18.97 kB raw / 4.96 kB gzip.
- Self-hosted fonts: 71.35 kB total.
- Mobile hero: 22.32 kB; desktop hero: 55.34 kB.

These are within the supplied budgets.

## Deployment identity

- `GET /health` returned
  `{"build_sha":"19733649f2e9051c73a3e69e33096f54adfdb940","ok":true}`.
- Live JavaScript, CSS, both hero images, social card, sandbox HTML, and sandbox
  runner matched local `dist/` byte for byte by SHA-256.
- Live JS SHA-256:
  `0a4fc212d3c11138ad468e441fb0f327aace5159bcb4e916bd43a01b2a510fef`.
- Live CSS SHA-256:
  `b15d5356871d4fe249df21861117c7699de759caf65c23fb4ba68a7c1eb9598b`.

The earlier deployment-only failure is not present.

## Independent product exercise

### One-click sample

A fresh mobile context opened the demo, followed its learner link, rejected an
empty required name, joined as **QA Night Owl**, changed code, rendered **Live
QA preview / Live QA worked**, and advanced the teacher view to **Done**. The
same loaded workbench rendered a changed preview while offline. Reset restored
all three starter files and the starter preview. Reset demo produced a new
`DEMO-*` URL.

The demo API reported `storage: "demo-blob"`, `is_demo: true`, and a 7,200-second
TTL. Demo identifiers were absent from both browser stores before joining. The
learner key appeared only in session storage, never local storage.

### Real room

Using the live creator, a teacher made **Build a QA status card** with custom
HTML, CSS, and JavaScript. A separate learner page received the exact files,
rendered **Starter ran**, and appeared on the teacher board as **Live Robin —
Ran code**. The room ID was non-demo. No console or page errors occurred.

### Boundaries and recovery

- Exact maxima passed: 80-character title, 600-character instructions, and
  50,000-byte HTML.
- 81-character title, 601-character instructions, and 50,001-byte HTML
  returned specific `400` messages.
- Blank and 25-character learner names returned `400 invalid_name`; the live
  browser's blank required field was announced by native form validation.
- Invalid progress returned `400`; a missing teacher token returned `403`.
- Eleven simultaneous joins produced 10×`200` and 1×`409 room_full`, exactly
  enforcing free capacity without duplicate over-admission.
- Teacher progress exposed only `name` and `status`; learner source was absent.
- Live-room TTL measured 86,400 seconds and a subsequent request retrieved the
  same 50,000-byte starter document.
- The full local suite also passed JavaScript-error recovery, monotonic Done,
  repeated preview runs, and delayed Back/Forward route races.

Evidence: [live-independent.json](qa-artifacts/live-independent.json) and
[live-independent.mjs](qa-artifacts/live-independent.mjs).

## Backend, rate limits, and billing

Every `/api/*` route is under the same rate-limit middleware; `/health` is the
documented exemption. The configured allowance is 13 requests per replica per
one-second window. A fresh live single-client burst of 60 `POST /api/demo`
requests across the three-replica service produced **39×200 and 21×429**. Every
429 included `Retry-After: 1`; a request succeeded after 1.1 seconds.

A 100-request concurrent `/health` smoke returned 100×200 in 156 ms, about 641
observed requests/second.

The Room Plus link returned the expected `303` from Sociobot's endpoint to its
hosted Dodo checkout. A fake license returned `{valid:false, reason:"invalid"}`
with `Cache-Control: no-store`. The recorded-valid local claim fixture proved
30 accepted learners and a 31st `409` without making a purchase.

No sign-in exists, which matches the anonymous-room brief. No AI feature is
needed for this focused live exercise tool. PWA update tests and library/CLI
consumer installation do not apply.

## Privacy, security, accessibility, and performance

- Live request logging across landing, legal pages, demo, join, edit, Run,
  Done, offline recovery, and reset saw only
  `https://lesson-code-room.sociobot.in`. There were no unexpected console or
  page errors and no cookies.
- Root responses include CSP with `frame-ancestors 'none'`, `nosniff`, strict
  referrer policy, `X-Frame-Options: DENY`, and camera/microphone/geolocation
  denial. The sandbox uses `connect-src 'none'`, `form-action 'none'`, no
  media/fonts, and `SAMEORIGIN` frame protection. API responses are `no-store`.
- Hashed JS, CSS, and fonts use one-year immutable caching. Stable hero artwork
  is not incorrectly treated as content-hashed.
- `/opt/fleet/lib/verify-url.sh` passed: 200, correct title, `lang=en`, one H1,
  main landmark, no missing alt text, named buttons, and zero load errors in
  641 ms.
- Independent axe scans found zero serious/critical issues on root, demo,
  privacy, terms, real 404, teacher, join, and workbench states.
- Keyboard-only checks passed the skip link, one-click demo, form submission,
  arrow-key code tabs, route focus, Back focus, and embedded preview control.
  The skip link measured 177×44 with a 3px amber focus ring. All measured public
  controls at 390px were at least 44px high and 46px wide.
- At 200% text, all tested public routes remained 390px wide without horizontal
  panning. Reduced-motion durations were 0.01 ms.
- Lighthouse 13 mobile: Performance 99, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.51 s, LCP 1.67 s, TBT 56 ms, CLS 0.0033.
- All discovered internal links returned 200; the real unknown route returned
  404 with a recovery link. `robots.txt`, sitemap, favicon, touch icon, and
  social image returned the correct types.

Evidence: [verify-url](qa-artifacts/verify-url/verify.json) and
[Lighthouse JSON](qa-artifacts/lighthouse.json).

## Defects by severity

- P0: none.
- P1: none.
- P2: none.
- P3: none.

## Re-run

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
node .factory/qa-artifacts/live-independent.mjs
```
