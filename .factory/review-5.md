# Run a shared coding exercise — review 5 — FAIL

Date: 2026-09-06

Live URL: <https://lesson-code-room.sociobot.in>

Implementation candidate: `e3a570da5ef9f784583f06ab81533892095f6767`

Documentation SHA reviewed: `c3753c953606812b4aca22d54e6152cb060cffe8`

Live `/health` build SHA: `19733649f2e9051c73a3e69e33096f54adfdb940`

The commits after `e3a570d` change only reports and documentation. The live JavaScript and CSS match the build from the implementation candidate byte for byte.

## Verdict

**FAIL.** One P1 finding remains. There are no untested declared claims. A PASS requires zero findings of every severity.

- Finding count: **1**
- Untested claim count: **0**
- P0: 0
- P1: 1
- P2: 0
- P3: 0

## First screen

Fresh Chromium contexts at 390 × 844 and 1440 × 900 answered the required questions before scrolling.

| Question | Answer on the page |
| --- | --- |
| Job | “Run one coding exercise together.” |
| Audience | “For remote teachers who need learners coding now, with clear progress and no student accounts.” |
| First action | “Try it with sample data,” followed by “A sample room opens with three learners.” |

The primary action was visible and keyboard reachable in both contexts. The first Tab focused the 177 × 44 skip link with a 3 px amber outline. The mobile page measured 390 px wide with no horizontal overflow.

## Finding

### F-5-1 — P1: production state does not use SQLite on the product `/data` mount

The current work order requires product state in SQLite on the fleet-created `/data` mount. It also limits owned resources to names beginning `sf-lesson-code-room`.

The implementation does the opposite when the platform provides managed-identity variables:

- `src/main.rs:325-348` selects `Store::Blob` instead of SQLite.
- `src/main.rs:372-383` targets the shared `sociobotblob` storage account and the `lesson-code-room` container. The demo path uses another `lesson-code-room-demo` container.
- `README.md:67` documents the managed-identity shared room store as the production path.
- The live demo API returned `storage: "demo-blob"`, confirming the deployed runtime uses the Blob branch.
- With only `PORT` set, the release binary started and survived a restart, but wrote `data/lesson-code-room.db` relative to its working directory. It did not select `/data/lesson-code-room.db`.
- `tests/product.spec.ts:668-676` currently asserts that the container must choose shared Blob storage, so the suite protects behavior that conflicts with this work order.

This places live and demo room state outside the product's fleet-managed SQLite mount and uses resource names outside the allowed prefix. The reviewer did not inspect, connect to, or change the storage account, managed identity, app settings, secrets, or any other service. Source, public documentation, and the product's own live response are enough to prove the conflict.

Required repair: remove the shared Blob path, default to SQLite at `/data/lesson-code-room.db` when `/data` exists, retain a safe local fallback, and update the storage tests and documentation. Keep one replica as required by the fleet mount. Redeploy, then repeat restart persistence and the teacher-to-learner flow.

## One-click sample and real room

The sample behavior passes apart from the separate storage-contract finding.

- One keyboard-activated click opened the populated **Make the night sky respond** teacher room.
- The first rendered sample showed Moss Finch — Done, Blue Comet — Ran code, and Quiet Fox — Joined.
- **Demo — sample data, nothing is saved**, **Reset demo**, and **Start for real** stayed available in teacher, join, and workbench views.
- A learner joined as **QA Night Owl**, edited HTML and JavaScript, ran the preview, and advanced to Done on the teacher board.
- The loaded workbench continued to edit and preview while offline.
- Reset restored HTML, CSS, JavaScript, and the starter preview. Reset demo changed the `DEMO-*` room identifier.
- Demo entry used no browser storage. The learner key appeared only in tab-scoped session storage.
- A separate live browser flow created **Build a review status card**, delivered the exact custom files to **Review Robin**, ran the output, and showed Ran code to the teacher.
- The live room remained readable after demo activity. No sample action changed that room.

## Declared claims

After dependency installation in a clean clone at documentation SHA `c3753c9`, every exact `test` command from `.factory/claims.json` passed separately. Each ID occurs in exactly one tagged test.

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

Landing, demo, workbench, legal, and README copy were cross-checked against the inventory. No unlisted or untested visitor outcome remains. The published shared-storage statement is demonstrably true of the current build, but that implementation is itself noncompliant under F-5-1.

For transparency, one initial reviewer invocation targeted the clean clone before its dependencies were installed and stopped at `vite: not found`; no assertion ran. After running `npm ci` in the clone, all 18 exact commands passed. This was a review setup error, not a product failure from the documented setup.

## Normal, invalid, boundary, and recovery paths

- A custom live teacher room and learner workbench completed end to end with no console errors.
- The exact maxima passed: 80-character title, 600-character instructions, and 50,000-byte HTML.
- Title length 81, instructions length 601, and HTML length 50,001 returned specific HTTP 400 guidance.
- Blank and 25-character learner names returned `invalid_name`.
- Invalid progress returned 400. Missing teacher authority returned 403.
- Eleven concurrent joins produced 10 successful joins and one `room_full` response.
- Teacher progress exposed only `name` and `status`.
- A 60-request demo burst produced 13 × 200 and 47 × 429. Every 429 included `Retry-After: 1`; a request succeeded after 1.1 seconds.
- One hundred concurrent health requests returned 100 × 200 in 134 ms.
- A local room persisted across graceful stop and restart when the release binary started with only `PORT` set.
- The Room Plus link returned the expected hosted-checkout redirect. A fake license returned `valid: false` and `reason: invalid`.

## Routes, accessibility, privacy, and performance

- `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and `/sandbox.html` returned 200.
- `/not-a-room` returned the expected designed HTTP 404 with **Page not found** and **Return home**. Its skip link correctly retained the 404 status.
- Every page route had its own plain title, one H1, one main landmark, a consistent header and footer, and correct focus transfer.
- Back restored and focused the landing H1. Code tabs worked with arrow keys.
- At 200% text, all audited phone routes stayed at 390 px without horizontal panning.
- All visible links, buttons, inputs, text areas, and tabs measured at least 44 × 44 px on the audited phone routes.
- Playwright Axe found zero serious or critical issues on landing, demo, legal, 404, teacher, join, and workbench states.
- Reduced-motion animation and transition durations were 0.01 ms.
- The full browser flow requested only `https://lesson-code-room.sociobot.in`, set no cookies, and logged no unexpected console error. The offline and deliberate 404 checks produced only their expected browser messages.
- All discovered links resolved. Internal pages and Param Factory returned 200, checkout returned 303, and the email link used `mailto:`.
- Security headers block framing, camera, microphone, and geolocation. The preview sandbox blocks network requests, forms, media, fonts, and base URL changes.
- `/opt/fleet/lib/verify-url.sh` passed in 595 ms with the correct title, `lang=en`, one H1, one main, no missing alt text, no unnamed button, and no console error.
- Lighthouse 13 mobile scored Performance 99, Accessibility 100, Best Practices 100, and SEO 100. FCP was 1.53 s, LCP 1.68 s, TBT 79 ms, and CLS 0.0033.
- The build produced 31.00 kB JavaScript raw / 9.72 kB gzip and 18.97 kB CSS raw / 4.96 kB gzip.

The site retains its product-specific lamp-lit classroom design, self-hosted type, asymmetric layout, plain copy, visible focus treatment, and reduced-motion path. It does not present a generic framework theme.

## Earlier finding disposition

Every earlier review, verification, polish report, and handoff was read. Earlier minor findings were included.

| Earlier finding | Current disposition |
| --- | --- |
| Verification P0: rooms failed across replicas | The failure does not reproduce. Shared Blob fixed the symptom, but that replacement now violates the current SQLite `/data` contract in F-5-1. |
| Verification P1: TypeScript check unavailable | Fixed. The clean-clone TypeScript command passed. |
| Verification P2: hashed assets lacked immutable caching | Fixed. Live hashed JS/CSS use immutable caching; stable art does not. |
| Verification-2 P1: privacy, retention, payment, and scope claims were missing | Fixed. All retained outcomes are inventoried and passed. |
| Verification-3 P1: learner reset claim was missing | Fixed. `learner-reset` passed and restored all three files plus preview. |
| Verification-4 P1: demo banner disappeared after join | Fixed. The banner and both actions stayed present. |
| Verification-4 P1: 404 contrast | Fixed. Axe and reflow passed on the designed 404. |
| Verification-5 P1: delayed route overwrote Back | Fixed. Back and Forward focus and route tests passed. |
| Verification-5 P1: paid capacity was not proved | Fixed. The recorded fixture proves 30 joins and rejects the 31st. |
| Verification-5 P1: pinned Rust builder | Fixed. `rust:1-slim` is used. |
| Verification-5 P2: privacy email target was too small | Fixed. All visible phone targets measured at least 44 px. |
| Verification-5 P2: forwarded-address documentation was wrong | Fixed. README and source use the right-most valid forwarded address. |
| Verification-6 P2: 200% text overflow | Fixed. Every audited route measured 390/390. |
| Verification-6 P2: overload returned 500 | Fixed. The source maps contention to retryable 503; the live rate-limit recovery passed. |
| F-1-1: demo first rendered a loading screen | Fixed. Populated sample data rendered before the API response. |
| F-1-2: 200% phone overflow | Fixed. Reflow passed on landing, demo, legal, and 404 routes. |
| F-1-3: private-screen promise was not inventoried | Fixed. The unsupported wording remains absent. |
| F-1-4: deep routes retained landing social metadata | Fixed. Route titles and social metadata update together. |
| F-1-5 through F-1-8: vague or metaphor copy | Fixed. All four phrases remain absent. |
| F-1-9 and F-1-10: overlong README sentences | Fixed. The sentences remain split and plain. |
| F-2-1: demo used the live room namespace | Functionally fixed through a separate demo namespace. The Blob implementation still falls under new finding F-5-1. |
| F-2-2: three-sample-learner promise was unlisted | Fixed. `demo-sample-data` passed with the exact three names and states. |
| F-3-1: 404 heading used a metaphor | Fixed. The heading is **Page not found**. |
| Polish enlarged-footer overlap | Fixed. Links remain separate at 200% text. |

## Clean checkout commands

These commands passed after `npm ci`:

```sh
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

`npm test` passed 4 Rust tests and 37 Playwright tests. Docker, Podman, and Buildah were unavailable, so a new container image was not built. The multi-stage Dockerfile, non-root user, rolling Rust base, build argument, port, and deployed health were inspected. The storage defect is proved without a local container engine.

## Required next step

Move all production room state to SQLite on `/data`, update the conflicting storage test and documentation, deploy the new implementation, and repeat this review. No product code was changed during review 5.
