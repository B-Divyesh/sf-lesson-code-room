# Independent verification — FAIL

Date: 2026-08-28  
Work order: `lesson-code-room-verify-1`  
Candidate: `a8a428aa8dc523f7efaeb5ee32d9d81d1dc9ed9b`  
Live URL: https://lesson-code-room.sociobot.in

## Verdict

**FAIL — do not release.** The public deployment cannot complete the product's core teacher-to-learner flow. A demo room is created successfully, but its learner join link consistently reports that the room does not exist.

## Release-blocking defects

### P0 — live rooms are not shared across deployed backend requests

`/demo` returns a successfully-created sample room and initially renders its teacher page. Its following progress request returns `404`, and the learner link renders the product's 404 state instead of the no-account join form.

Fresh-browser reproduction on the live deployment, 2026-08-28:

| Attempt | Room created by `/demo` | Teacher progress | Learner link |
| --- | --- | --- | --- |
| 1 | `MXDHWP` | `404 This room does not exist or has expired` | 404; no Screen name field |
| 2 | `XQUQYT` | same | same |
| 3 | `TBMCMD` | same | same |
| 4 | `SPHDXA` | same | same |
| 5 | `NVNTQB` | same | same |
| 6 | `ANVLFV` | same | same |

An independent direct check created `AWXCQY` through `POST /api/demo` (200, two-hour expiry), then `GET /room/AWXCQY` rendered: “This room does not exist. Check the six-letter room code.” Browser console recorded the corresponding failed resource (404). This violates the researched brief's central job: a teacher must share one working learner link and see anonymous progress.

The deployment behavior is consistent with requests reaching backend instances that each use their own default local SQLite file (`sqlite:///data/lesson-code-room.db`). The prior handoff itself notes that a multi-replica deployment needs a shared PostgreSQL database or sticky routing; the live deployment is now exhibiting that exact failure. Repair by deploying a shared durable database (preferred), then repeat this cross-request/cross-browser teacher and learner flow on the deployed URL. A local volume or an in-process database is not sufficient for this hosted product.

### P1 — the configured strict TypeScript check does not run

`npx tsc --noEmit -p frontend/tsconfig.json` exits 2. `frontend/tsconfig.json` includes `vite.config.ts`, but `package.json` does not supply Node type declarations. Errors are `TS2307: Cannot find module 'node:path'` and `TS2339: Property 'dirname' does not exist on type 'ImportMeta'` (twice). The production Vite build succeeds without type-checking, so this gap is hidden by `npm run build`.

### P2 — immutable hashed assets lack a cache policy

Live `HEAD` responses for `/assets/index-BBeU5N0A.js` and `/assets/index-BLQjfvdB.css` contain no `Cache-Control` header. This misses the documented long-lived immutable-cache policy for hashed assets. It is not the reason for the release block.

## Required first checks

### First-read test — PASS on the landing page only

Cold desktop visit to `/` (200, no console errors) plainly states:

- What: “Run one coding exercise together.”
- For whom: “For remote teachers who need learners coding now…”
- First action: visible “Try it with sample data,” with “A sample room opens with three learners.”

The button is one click to `/demo`, but the sample's learner link is broken by P0, so the demo requirement is not met end to end.

### Declared claims — PASS locally from the clean checkout

`.factory/claims.json` exists and declares eight tests. After `npm ci`, each exact command passed against the product's local demo entry point:

| Claim | Command result |
| --- | --- |
| `anonymous-room` | pass |
| `sandbox-run` | pass |
| `demo-reset` | pass |
| `privacy-code` | pass |
| `free-capacity` | pass |
| `room-retention` | pass |
| `demo-retention` | pass |
| `paid-checkout` | pass |

The passing local claims do not establish a working deployment because their Playwright server is one local process with one SQLite database.

## Verification evidence

| Area | Evidence / result |
| --- | --- |
| Clean install | `npm ci` passed; 0 audited vulnerabilities. |
| Full suite | `npm test` passed: production build, 2 Rust unit tests, and 11 Playwright tests (including local axe and rate-limit tests). |
| Production build | `npm run build` passed; JS 27.02 KB raw / 8.87 KB gzip, CSS 17.50 KB raw / 4.71 KB gzip, fonts 71.35 KB total. |
| Rust quality | `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings` passed. |
| TypeScript quality | Failed as P1 above. |
| Release runtime | `cargo build --release` passed. The release binary started with no configuration and `/health` returned `{"build_sha":"dev","ok":true}`. Docker could not be tested because `docker` is not installed in this verifier environment. |
| Deployment identity | Live `/health` returned `{"build_sha":"a8a428aa8dc523f7efaeb5ee32d9d81d1dc9ed9b","ok":true}`. Its JS/CSS fingerprints exactly matched the local `dist/` build: `index-BBeU5N0A.js`, `index-BLQjfvdB.css`. |
| Live routes | `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, and `/sitemap.xml` returned 200; an unknown route returned 404. |
| API normal/boundary paths | On a live room, 12 simultaneous joins yielded 10×200 and 2×409; empty and 25-character names yielded the documented 400; invalid status yielded 400; invalid learner/teacher tokens yielded 403; lowercase room lookup returned 200. This test can occasionally hit one backend instance and is superseded by the deterministic cross-browser P0 failure. |
| Rate limiting | Live burst of 48 `POST /api/demo` requests with one `X-Forwarded-For` identity: 40 accepted, 8 returned 429; every 429 had `Retry-After: 1`. |
| Response policy | Live CSP, `X-Content-Type-Options: nosniff`, strict referrer policy, permissions policy, and frame protection are present. `/sandbox.html` has `connect-src 'none'`, restrictive script/form/media/font policies, and `X-Frame-Options: SAMEORIGIN`; the main page is DENY. Local sandbox claim verified attempted external fetch and same-origin script loading do not leave the frame. |
| Privacy / outbound behavior | The static landing, privacy, and terms pages made no console errors; no third-party page resources were observed on the cold landing. Full live learner privacy-flow verification is blocked by P0. |
| Accessibility and mobile | Local suite: no serious/critical axe findings on landing, demo, legal, join, and workbench pages; 390px layout has no overflow. Live axe scans of `/`, `/privacy`, and `/terms` at 390px found no serious/critical violations, no horizontal overflow, and no console errors. The live demo cannot reach a learner workbench because of P0. |
| Keyboard / motion | Local browser suite covers skip link and editor arrow-tab operation. CSS supplies a 3px visible focus outline and a `prefers-reduced-motion` override. Live first screen exposes the skip link and a 48px primary action. |

## Retest gate

1. Replace deployment-local room storage with shared durable storage and migrate the room/participant schema.
2. Deploy the repaired candidate.
3. From separate fresh browser contexts on the live URL, create `/demo`, open its learner link, join, run code, mark done, and observe the teacher progress state.
4. Re-run all declared claim tests, full `npm test`, a working strict TypeScript check, the live rate burst, and live mobile/axe checks.
