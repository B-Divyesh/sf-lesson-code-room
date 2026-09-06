# Run one shared coding exercise — verification 10 — PASS

Date: 2026-09-06

Work order: `lesson-code-room-verify-10`

Live URL: <https://lesson-code-room.sociobot.in>

Implementation candidate: `8cfa5ff067bf28426a8e12c3185a52af5360f056`

Documentation SHA: `445a9aacb5d2d6a4c87330547a98347448653897`

Live `/health` SHA: `445a9aacb5d2d6a4c87330547a98347448653897`

The only change from the implementation candidate to the documentation SHA is `.factory/handoff.md`. The live JavaScript and CSS match a clean build of the implementation candidate byte for byte.

## Verdict

**PASS.** There are zero findings of every severity and zero untested claims.

- Finding count: **0**
- Untested claim count: **0**
- P0: 0
- P1: 0
- P2: 0
- P3: 0

## First screen

Fresh Chromium contexts at 390 × 844 and 1440 × 900 answered the required questions before scrolling.

| Question | Answer on the page |
| --- | --- |
| Job | “Run one coding exercise together.” |
| Audience | “For remote teachers who need learners coding now, with clear progress and no student accounts.” |
| First action | “Try it with sample data,” followed by “A sample room opens with three learners.” |

The action was visible and keyboard reachable in both contexts. The first Tab focused the 177 × 44 skip link with a 3 px amber outline. The 390 px layout had no horizontal overflow. The lamp-lit classroom art, dark teal and amber palette, self-hosted type, clipped controls, and asymmetric layout match `.factory/design.md`.

## One-click sample and real work

- One keyboard-activated action opened **Make the night sky respond** with Moss Finch — Done, Blue Comet — Ran code, and Quiet Fox — Joined.
- **Demo — sample data, nothing is saved**, **Reset demo**, and **Start for real** remained present through teacher, join, and workbench views.
- A learner joined without an account as **QA Night Owl**, changed HTML and JavaScript, ran the preview, and reached Done on the teacher board.
- The loaded workbench continued to edit and preview while offline. Reconnecting restored progress updates.
- **Reset starter code** restored HTML, CSS, JavaScript, and the starter preview. **Reset demo** created a different `DEMO-*` room.
- Demo entry used no local or session storage. The learner key appeared only in that learner tab's session storage.
- Demo traffic used only the product origin, set no product cookies, and produced no unexpected console error.
- A separate live room accepted 80 title characters, 600 instruction characters, and 50,000 HTML bytes. The 81, 601, and 50,001 boundaries returned clear HTTP 400 responses.
- Ten learners joined a free room; the eleventh received `room_full`. Blank and 25-character names were rejected.
- Teacher progress exposed only `name` and `status`. Missing, wrong-room teacher, and wrong-room learner credentials returned HTTP 403.

Demo actions did not alter the live QA room. The live room remained readable before and after demo use.

## Backend and persistence

- The active product revision was `sf-lesson-code-room--0000031` with one configured replica.
- A live QA room was read before an authorized managed restart of that revision and returned HTTP 200 after the restart.
- A pre-restart `DEMO-*` room changed from HTTP 200 to HTTP 404 after restart, proving that demos remain process-memory-only.
- The same no-config release binary started locally with only `PATH` and `PORT`. It logged `local SQLite fallback (/data unavailable)`, created a room, stopped cleanly, restarted, and returned the same room.
- Source defaults live storage to `/data/lesson-code-room-v2.db` when `/data` exists. The deployed persistence result proves the mounted SQLite path works.
- A 60-request live API burst produced 13 × 200 and 47 × 429. Every 429 included `Retry-After: 1`; a request succeeded after 1.1 seconds.
- One hundred concurrent `/health` requests returned 100 × 200 in 118 ms. Health is intentionally exempt from rate limiting.
- API responses use `no-store`. Security headers deny framing, camera, microphone, and geolocation. The preview policy includes `connect-src 'none'`, `form-action 'none'`, and no same-origin sandbox permission.

## Declared claims

The repository was cloned cleanly at documentation SHA `445a9aa`. `npm ci` installed the locked dependencies with zero audit vulnerabilities. Every exact `test` command in `.factory/claims.json` then ran separately and passed.

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

Each claim ID appears in exactly one tagged test. Landing, demo, workbench, legal, and README wording was cross-checked against the inventory. No false, incomplete, missing, duplicate, or untested public claim was found.

The Room Plus checkout returned its expected HTTP 303 hosted-checkout redirect. An invalid license returned `valid: false`, `reason: invalid`, `Cache-Control: no-store`, and the product-origin CORS allowance. The recorded-valid test proves the 30-learner outcome and rejects learner 31 without making a purchase.

## Quality, accessibility, routes, and performance

The clean checkout passed:

```sh
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

`npm test` passed 6 Rust tests and 36 Playwright tests. `dist/` was produced. The JavaScript is 31.00 kB raw / 9.72 kB gzip; CSS is 18.97 kB raw / 4.96 kB gzip; bundled fonts total 71.35 kB.

- Factory `verify-url.sh`: PASS in 625 ms with HTTPS 200, the correct title, `lang=en`, one H1, one main landmark, image alternatives, named buttons, and zero console errors.
- Independent Playwright Axe scans: zero serious or critical violations on landing, demo, Privacy, Terms, real 404, and desktop landing. The full suite also covers join and workbench states.
- Keyboard: skip link, demo action, form submission, editor tab arrow navigation, Run, Done, reset confirmation, Back, and Forward passed. Focus moved to route H1s.
- Motion and reflow: reduced-motion durations were 0.01 ms. Every public route, including 404, measured 390 px client and scroll width at 200% text.
- Touch targets: the full regression suite passed the 44 px target checks, including the privacy email link.
- Routes: `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and `/sandbox.html` returned 200. `/not-a-room` deliberately returned a designed HTTP 404 with **Page not found** and **Return home**.
- Metadata: every page route had its own title, description, canonical URL, Open Graph title, and Twitter title.
- Links: internal links and Param Factory returned 200; checkout returned 303; the privacy address is an explicit `mailto:` link. No broken link was found.
- Lighthouse 13 mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.50 s, LCP 1.65 s, TBT 36 ms, CLS 0.0033.
- Live/local parity: JavaScript SHA-256 `0a4fc212d3c11138ad468e441fb0f327aace5159bcb4e916bd43a01b2a510fef`; CSS SHA-256 `b15d5356871d4fe249df21861117c7699de759caf65c23fb4ba68a7c1eb9598b`.

This product is not a PWA, library, CLI, desktop app, or sign-in product. Update-install, consumer-package, desktop-install, and account-recovery checks do not apply. The only offline promise is loaded workbench editing and preview, which passed.

## Earlier finding disposition

Every earlier review, verification, polish report, and prior handoff was read, including minor findings.

| Earlier finding | Current disposition |
| --- | --- |
| Cross-request room loss | Fixed. Separate browser contexts complete the live teacher/learner flow. SQLite restart persistence passed. |
| TypeScript gate unavailable | Fixed. The clean-checkout TypeScript command passed. |
| Hashed assets lacked immutable caching | Fixed. Live content-hashed JS/CSS are immutable; stable art is not. |
| Missing privacy, retention, payment, scope, learner-reset, and exact sample claims | Fixed. All 18 claims are inventoried once and passed separately. |
| Demo banner disappeared after join | Fixed. The banner and both actions persist through join and workbench views. |
| 404 contrast and metaphor heading | Fixed. The real 404 says **Page not found**, reflows, and has no serious or critical Axe violation. |
| Delayed route overwrote Back | Fixed. Delayed Back/Forward tests pass, and live focus restoration passed. |
| Paid capacity was not proved | Fixed. The recorded-valid fixture proves 30 joins and rejects learner 31. |
| Pinned Rust builder | Fixed. The Dockerfile uses `rust:1-slim`. |
| Privacy email target below 44 px | Fixed. The target regression passes. |
| Forwarded-address documentation was wrong | Fixed. README and implementation both specify the right-most valid ingress-appended address. |
| 200% phone overflow and enlarged footer overlap | Fixed. All audited routes remain 390/390 at 200% text. |
| Overload returned HTTP 500 | Fixed. Retryable contention is covered, and live bursts return 429 with retry guidance. |
| Demo first showed loading instead of sample data | Fixed. The populated sample renders immediately and the exact sample test passes. |
| Demo shared the production store | Fixed. Demo storage is memory-only; restart removed demo state while live SQLite state persisted. |
| Deep routes retained landing metadata | Fixed. Live route metadata is specific on all audited routes. |
| Vague, metaphorical, and overlong copy | Fixed. The reported phrases remain absent and the copy audit is clean. |
| Production used Blob instead of SQLite `/data` | Fixed. Blob code is removed; live SQLite persistence passed through a managed restart. |

## Final result

**PASS.** Finding count: **0**. Untested claim count: **0**. No product code was changed during verification.
