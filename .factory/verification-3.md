# Independent verification 3 — FAIL

Date: 2026-08-28  
Work order: `lesson-code-room-verify-3`  
Candidate and deployed build: `5dd8f3ebf3259231829a767f508ad6273135b1a9`  
Live URL: https://lesson-code-room.sociobot.in

## Verdict

**FAIL — do not release.** The deployed product and its core teaching flow now work, but the candidate fails the mandatory claims contract: a public README promise has no corresponding `.factory/claims.json` entry and no tagged observable test. The claims skill explicitly makes this a failing review finding.

## Release-blocking finding

### P1 — learner code reset is a published, unlisted claim

`README.md:15` promises: “Let each learner edit, run, **reset**, and mark the exercise done.” The learner workbench also exposes **Reset starter code**. The inventory contains only `demo-reset`, which tests resetting the sample *room*, not reset of a learner’s HTML/CSS/JS copy. No test in `tests/product.spec.ts` exercises the learner reset control, and no `@claim:<id>` is declared for it.

Fresh live check: changed learner HTML, accepted the exact confirmation dialog, selected **Reset starter code**, and observed the original starter code restored with “Starter code restored.” The functionality works; it still cannot be accepted as a visitor-facing promise until a separate claim (for example `learner-reset`) and its exact demo-entry test are added. This is a documentation/test-contract defect, not a request to remove the feature.

## Required first gates

### Cold first-read — PASS

A fresh desktop context loaded `/` with HTTP 200 and no console errors. The first screen says:

- **What it does:** “Run one coding exercise together.”
- **For whom:** “For remote teachers who need learners coding now, with clear progress and no student accounts.”
- **First action:** “Try it with sample data” followed by “A sample room opens with three learners.”

The action is one click to `/demo`; it opens the persistent “Demo — sample data, nothing is saved” banner with Reset demo and Start for real.

### Declared claim commands — PASS (15/15)

From the clean checkout, after `npm ci` (26 packages; 0 vulnerabilities), every exact command declared in `.factory/claims.json` passed independently. Each command built the product, ran the Rust tests, and ran its Playwright test against the local demo entry point.

| Claims that passed |
| --- |
| `anonymous-room`, `custom-room`, `sandbox-run`, `demo-reset`, `privacy-code` |
| `teacher-report-limits`, `product-scope`, `no-tracking`, `session-storage`, `offline-preview` |
| `rate-limit`, `free-capacity`, `room-retention`, `demo-retention`, `paid-checkout` |

This pass does not cure the separate unlisted reset promise above.

## Evidence from independent QA

| Area | Result |
| --- | --- |
| Candidate/live match | PASS. Live `/health` returned `{"build_sha":"5dd8f3ebf3259231829a767f508ad6273135b1a9","ok":true}`. Live HTML references `index-BXRyTvu4.js` and `index-BLQjfvdB.css`, matching the local candidate `dist/`. |
| Full tests | PASS. `npm test`: Vite production build, 2 Rust unit tests, and all 21 Playwright tests passed. |
| Available quality checks | PASS. `npx tsc --noEmit -p frontend/tsconfig.json`, `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo build --locked --release`, and a separate `npm run build` all passed. |
| Runtime configuration | PASS. The release binary started from the repository with only `PORT=4188`; `/health` returned `{"build_sha":"dev","ok":true}` and startup logged the intentional local SQLite fallback. |
| Production teacher/learner journey | PASS. Two fresh browser contexts used live `/demo`: seeded Moss Finch/Blue Comet/Quiet Fox appeared; an anonymous `QA Learner` joined, changed HTML, ran the page, marked Done, and the still-open teacher page updated to show `QA Learner — Done`. No page or console errors. A separate live landing flow created `QA custom exercise`; its learner received exactly `<main><h1>QA custom starter</h1></main>`. |
| Demo isolation/reset | PASS. Live Reset demo changed the join room from `LEEWNA` to `QCSPBC`; banner and Start for real link (`/#create`) remained present. |
| Boundary/recovery paths | PASS. Blank and 25-character names returned `400 invalid_name`; ten joins returned 200 and the eleventh 409; invalid progress returned `400 invalid_status`; lowercase room lookup returned 200. Teacher report held ten records and each public record had exactly `name` and `status`. |
| Rate limit | PASS. A 48-request live `POST /api/demo` burst from one forwarded identity yielded **39×200 and 9×429**. Every limited response included `Retry-After: 1`; the observed fleet threshold was 39 accepted requests before limiting (three-replica deployment). |
| Concurrency/persistence | PASS. 100 simultaneous live reads of an independently created room, each with a distinct forwarded identity, returned 100×200 in 820 ms. The cross-context teacher/learner flow above confirms room state survives separate browser/backend requests. |
| Privacy/outbound requests | PASS. Full live demo flow made no cross-origin HTTP(S) page request; the only non-HTTP origin observed was `blob:` used inside the isolated preview. Learner edits were not sent by the declared privacy claim test. No sign-in is present. |
| Security headers/policies | PASS. Main responses include CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`. `/sandbox.html` has `connect-src 'none'`, `form-action 'none'`, media/font denial, and `SAMEORIGIN`; cross-origin `OPTIONS /api/demo` returned 405 with no CORS allow header. |
| Routes/cache | PASS. `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and `/sandbox.html` returned 200; an unknown route returned 404. Hashed JS returned `Cache-Control: public, max-age=31536000, immutable`. |
| Accessibility | PASS. `/opt/fleet/lib/verify-url.sh` passed against production (646 ms browser load; title, `lang=en`, one h1, main, image alt, named buttons, no console errors), evidence `/tmp/lcr-verify-url-SwnxuU`. Live axe scans on `/`, `/demo`, `/privacy`, and `/terms` reported no serious or critical violations. |
| Mobile/keyboard/motion | PASS. At 390 px, `scrollWidth` was 390, the primary demo action measured 214.8×48 px, and the first Tab reached the visibly focused 44 px “Skip to main content” link. Under reduced motion, animation and transition durations were `0.01ms`. |
| Build budget | PASS. Production build: JS 27.63 KB raw / 8.94 KB gzip; CSS 17.50 KB raw / 4.71 KB gzip; bundled fonts 71.35 KB raw; mobile hero 22.32 KB. All meet stated budgets. |

## Verification limitations

- Docker is not installed in this verifier container, so a local image build could not be rerun. The Dockerfile was statically checked and the live candidate identity/runtime were verified.
- A fresh Lighthouse CLI installation could not obtain a usable Chrome session in this container (headless Chrome tab crash). This is not the release blocker; independent browser load, mobile, axe, and bundle-budget checks above completed.

## Retest gate

1. Add the learner-reset promise to `.factory/claims.json` with an exact `@claim:learner-reset` test that enters `/demo`, changes code, accepts reset confirmation, and asserts all three original fields/preview are restored.
2. Re-run every listed claim command from a clean checkout, `npm test`, and the deployed demo reset smoke.
3. Publish a new verification report with the new candidate SHA and live health identity.
