# Adversarial first-read review 4 — PASS

Date: 2026-08-29

Live URL: <https://lesson-code-room.sociobot.in>

Repository reviewed: `ba70c4d9be72054e322273c097e77fcb7bbf1a5a`

Deployed product commit: `19733649f2e9051c73a3e69e33096f54adfdb940`

Contexts: fresh Chromium at 390 × 844 and 1440 × 900; clean clone at `/tmp/lesson-code-room-review4-clone-cHDCIg`

## Verdict

**PASS.** No blocking or minor finding remains. The cold first screen is clear in both viewports, the first click opens a populated isolated demo, all 18 declared claims pass individually, the complete 37-test browser suite passes, and no unlisted material product claim was found. The earlier review findings remain fixed in the live deployment and current source.

## Cold first read

Before scrolling, both fresh contexts answered all three required questions:

| Question | Answer from the first screen |
| --- | --- |
| What does it do? | “Run one coding exercise together.” |
| For whom? | “For remote teachers who need learners coding now, with clear progress and no student accounts.” |
| What should I click first? | “Try it with sample data,” followed by “A sample room opens with three learners.” |

At 390 px, the action and its stated result are visible on the first screen. The page has one H1, one main landmark, no horizontal overflow, no unexpected console error, and a keyboard-reachable skip link and demo action. The same answers are visible on desktop.

## Findings

None.

## Copy audit

Counts split on whitespace. Starter code is realistic editable input rather than landing prose. Navigation labels, form labels, headings, actions, facts, and footer lines are included even when they are fragments. No audited item exceeds 22 words, uses a banned marketing adjective, changes terminology, relies on a mood metaphor, or uses a non-result-naming primary action.

### Landing page

| Text | Words | Result |
| --- | ---: | --- |
| Lesson Code Room | 3 | Pass — product name |
| Create a room | 3 | Pass — destination link |
| Demo | 1 | Pass — destination link |
| Privacy | 1 | Pass — destination link |
| Run one coding exercise together | 5 | Pass — job headline |
| For remote teachers who need learners coding now, with clear progress and no student accounts. | 15 | Pass — `anonymous-room` |
| Try it with sample data | 5 | Pass — result-naming action |
| A sample room opens with three learners. | 7 | Pass — `demo-sample-data` |
| No student accounts | 3 | Pass — `anonymous-room` |
| Rooms close after 24 hours | 5 | Pass — `room-retention` |
| Free for 10 learners | 4 | Pass — `free-capacity` |
| Teachers see screen names and Joined, Ran code, or Done. | 10 | Pass — `teacher-report-limits` |
| Set one exercise | 3 | Pass — section heading |
| Use the starter or paste your own HTML, CSS, and JavaScript. | 11 | Pass — `custom-room` |
| Learners each get an editable copy. | 6 | Pass — `custom-room` |
| Exercise title | 2 | Pass — label |
| Instructions | 1 | Pass — label |
| HTML | 1 | Pass — label |
| CSS | 1 | Pass — label |
| JavaScript | 1 | Pass — label |
| Create room and join link | 5 | Pass — result-naming action |
| Your room and starter code close after 24 hours. | 9 | Pass — `room-retention` |
| How the room works | 4 | Pass — section heading |
| Create the exercise | 3 | Pass — step heading |
| Set one task and starter page before the call. | 9 | Pass |
| Share one link | 3 | Pass — step heading |
| Learners choose a screen name and start in their browser. | 10 | Pass — `anonymous-room` |
| Watch simple progress | 3 | Pass — step heading |
| See who joined, ran code, or marked the task done. | 10 | Pass — `anonymous-room` |
| Teach without surveillance | 3 | Pass — section heading states the limit |
| Teachers see screen names and three progress states. | 8 | Pass — `teacher-report-limits` |
| They do not get grades or detailed activity reports. | 9 | Pass — `teacher-report-limits` |
| Runs HTML, CSS, and JavaScript only | 6 | Pass — `product-scope` |
| No automatic grading or detailed activity reports | 6 | Pass — `teacher-report-limits` |
| No repository imports or video calls | 6 | Pass — `product-scope` |
| For larger tutoring groups | 4 | Pass — audience label |
| Room Plus: $29 once | 4 | Pass — price heading |
| Room Plus raises new rooms from 10 to 30 learners. | 10 | Pass — `paid-checkout` |
| Free rooms keep the 10-learner limit. | 6 | Pass — `paid-checkout`, `free-capacity` |
| Buy Room Plus | 3 | Pass — result-naming action |
| Restore a license | 3 | Pass — result-naming action |
| License token | 2 | Pass — label |
| Verify license | 2 | Pass — result-naming action |
| One-time purchase. | 2 | Pass — `paid-checkout` |
| Sociobot hosts the checkout. | 4 | Pass — `paid-checkout` |
| One exercise room for the first minutes of a live lesson. | 11 | Pass — product scope |
| Privacy | 1 | Pass — destination link |
| Terms | 1 | Pass — destination link |
| Built by Param Factory | 4 | Pass — provenance link |
| Original generated classroom art | 4 | Pass — provenance |

### README

Headings, command blocks, and URL-only lines are labels rather than sentences. The technical terms appear only in run, container, data, security, and billing documentation, where they identify concrete interfaces or implementation constraints.

| Sentence | Words | Result |
| --- | ---: | --- |
| Run one shared HTML, CSS, and JavaScript exercise during a live remote lesson. | 13 | Pass |
| Teachers create a short-lived room, share one learner link, and see only three progress states: Joined, Ran code, and Done. | 20 | Pass |
| The product is for teachers and tutors who need learners coding without account setup. | 14 | Pass |
| It is not an LMS, grader, repository, proctoring tool, or video service. | 12 | Pass |
| Create one exercise with starter HTML, CSS, and JavaScript. | 9 | Pass |
| Share a room link with up to 10 learners for free. | 11 | Pass |
| Let each learner edit, run, reset, and mark the exercise done. | 11 | Pass |
| See anonymous screen names move through three progress states. | 9 | Pass |
| Run learner code in a sandbox that blocks network requests. | 10 | Pass |
| Expire live rooms after 24 hours and demo rooms after two hours. | 12 | Pass |
| Open temporary isolated sample data through `/demo` without changing live rooms. | 10 | Pass |
| Restore a Room Plus license through Sociobot billing. | 8 | Pass |
| Room Plus costs $29 once and raises new rooms to 30 learners. | 12 | Pass |
| Requirements: Node.js 22+, npm, Rust 1.89+, and a Chromium browser for Playwright. | 12 | Pass |
| Open `http://localhost:8080`. | 2 | Pass |
| Outside Azure, the server creates `data/lesson-code-room.db`. | 6 | Pass |
| Supplying `DATABASE_URL` also selects SQLite, which is useful for isolated local tests. | 12 | Pass |
| Vite runs on `http://localhost:5173` and proxies `/api` to the Rust server. | 11 | Pass |
| This command builds `dist/`, runs Rust tests, and starts the production server. | 11 | Pass |
| It then runs Playwright claim and accessibility tests on port 4174. | 10 | Pass |
| Playwright is pinned to 1.58.2. | 5 | Pass |
| Run one documented claim: | 4 | Pass |
| The claims and their sandbox evidence are listed in `.factory/claims.json`. | 10 | Pass |
| Demo behavior is documented in `.factory/demo.md`. | 6 | Pass |
| The image runs as a non-root user, listens on `PORT` (default `8080`), and serves the built frontend from the same process. | 21 | Pass |
| In the factory container, the service uses its managed identity for the shared room store. | 14 | Pass |
| Teacher and learner requests can reach different replicas safely. | 9 | Pass |
| Local development and explicit `DATABASE_URL` test runs use SQLite. | 9 | Pass |
| No storage secret is baked into the image. | 8 | Pass |
| Room creation stores starter code, a random teacher token, and an expiry. | 12 | Pass |
| Joining stores a chosen screen name and progress state. | 9 | Pass |
| Learner edits are not sent in progress updates. | 8 | Pass |
| Product pages load no advertising trackers. | 6 | Pass |
| The preview iframe has no same-origin permission, and its CSP blocks network, forms, media, fonts, and base URL changes. | 19 | Pass |
| All API routes except `/health` limit bursts by the right-most valid `X-Forwarded-For` address appended by the trusted ingress. | 18 | Pass |
| Limited requests return `429` with `Retry-After: 1`. | 7 | Pass |
| See `/privacy` and `/terms` in the app for the user-facing policies. | 11 | Pass |
| The free room limit is 10 learners. | 7 | Pass |
| Room Plus uses the Sociobot hosted checkout and license verification APIs. | 11 | Pass |
| No payment provider code or product ID is embedded here; the factory registers the slug at release. | 17 | Pass |
| MIT. | 1 | Pass |
| See `LICENSE`. | 2 | Pass |
| Bundled font notices are in `THIRD_PARTY_NOTICES.md`. | 6 | Pass |

The visitor-facing product promises map to the claim inventory. Developer-operation statements describe commands or source configuration and were verified by the clean-clone build, source inspection, or the full suite; they do not introduce a separate visitor outcome. No material landing or README product claim is unlisted.

## Demo and sandbox behavior

- One click opened `/?demo=1`. Before the delayed API response completed, the first rendered screen already showed **Make the night sky respond**, Moss Finch — Done, Blue Comet — Ran code, and Quiet Fox — Joined.
- The **Demo — sample data, nothing is saved** banner, **Reset demo**, and **Start for real** remained present in the teacher, join, and learner workbench views.
- Reset replaced `DEMO-TRQUWY` with a different demo room. The live API separately returned `storage: "demo-blob"` and another `DEMO-*` identifier with a two-hour TTL.
- A demo learner edited and ran realistic HTML and JavaScript, reached Done on the teacher view, continued editing and previewing offline, and restored all starter files and the preview.
- Demo entry wrote no local or session storage. The learner workbench used one tab-scoped `sessionStorage` key and no `localStorage` key. Source selects the dedicated `lesson-code-room-demo` deployment container; live room identifiers cannot resolve that tenant.
- The complete live flow requested only `https://lesson-code-room.sociobot.in`, set no cookies, and produced no unexpected console or page errors. The sandbox CSP has `connect-src 'none'`.

## Claim results

Every exact `test` command in `.factory/claims.json` ran separately after `npm ci` in the clean clone.

| Claim ID | Result |
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

No declared claim failed or remained untested.

## Structure, links, accessibility, and identity

- `/`, `/demo`, `/privacy`, and `/terms` returned 200. `/missing-classroom` returned a designed HTTP 404 headed **Page not found** with a **Return home** action.
- Every audited route has one H1, one main landmark, route-specific title, description, canonical, Open Graph and Twitter text, consistent header/footer, Privacy and Terms links, and focus transfer on navigation. Back restored and focused the landing H1.
- The root title is **Lesson Code Room — Run a shared coding exercise**. The social card is a real 1200 × 630 product image, the Apple touch icon is 180 × 180, and the favicon, robots file, and sitemap resolve.
- The live link crawl found no dead navigational link: internal destinations returned 200, Param Factory returned 200, the explicit email remained `mailto:`, and the Sociobot checkout returned its expected 303 hosted-checkout redirect. The 404 page's skip link retains that page's intentional 404 response.
- At 390 px and 200% root text, all five public route cases measured 390 px client and scroll widths. Axe found zero serious or critical issue on mobile routes and desktop landing. Focus indicators, 44 px targets, reduced motion, keyboard tabs, and alt text passed.
- The production JavaScript is 31.00 kB raw and 9.72 kB gzip. The live URL verifier reported a 594 ms network-idle load, no console errors, `lang="en"`, one H1, one main landmark, and no missing image alt text.
- The blue-black classroom scene, amber lamp controls, clipped desk-paper corners, asymmetric layout, original classroom art, and self-hosted Fraunces/Atkinson pairing match `.factory/design.md`. The result is distinct from a generic centered SaaS hero or feature-card template.

## Earlier finding verification

Every earlier review and polish file and the prior handoff were read. The deployed source matches product commit `19733649`; changes after that commit are documentation only.

| Earlier finding | Current live and source verification |
| --- | --- |
| F-1-1 | Fixed: the populated three-learner teacher view renders synchronously before `/api/demo` resolves. |
| F-1-2 | Fixed: landing, demo, legal routes, and 404 all reflow at 390 px and 200% text without horizontal panning. |
| F-1-3 | Fixed: the unsupported private-screen slogan remains absent; teacher-visible fields are limited to names and three states. |
| F-1-4 | Fixed: each route updates title, description, canonical, Open Graph, and Twitter metadata. |
| F-1-5 | Fixed: “One room. One exercise. Start teaching.” remains absent. |
| F-1-6 | Fixed: “The real first step” remains absent. |
| F-1-7 | Fixed: “A short teaching loop” remains absent. |
| F-1-8 | Fixed: “A room, not a watchtower” remains absent. |
| F-1-9 | Fixed: the README test explanation remains split into 11- and 10-word sentences. |
| F-1-10 | Fixed: the README container explanation remains split into 14- and 9-word sentences. |
| F-2-1 | Fixed: demo IDs select the separate demo store; live returned `demo-blob`, source names `lesson-code-room-demo`, and the isolation claim passed. |
| F-2-2 | Fixed: `demo-sample-data` inventories and tests exactly the three named first-render states. |
| F-3-1 | Fixed: the live 404 H1 is the direct **Page not found**, and the exact route-copy regression test passed. |

The polish-only cache-hash and crowded enlarged-footer regressions also remain fixed: the live hashed JavaScript receives immutable caching, while stable art does not, and footer links remain separate and inside the viewport at 200% text. The prior handoff's unavailable-Docker-runtime note is an environment limitation rather than an open product finding; the Docker contract is covered by source assertions, and the matching deployed container is healthy.

## Missed leverage

No missing AI, import/export, or sync feature is implied by the brief's smallest useful product: one short-lived shared exercise during a live lesson. Adding model access would add cost and privacy surface without completing the stated job. No decorative AI control, provider key, or direct Azure endpoint appears in the product.

## Verification summary

- `npm ci`: PASS, 26 packages, zero vulnerabilities.
- All 18 exact `.factory/claims.json` commands: PASS individually.
- `npm test`: PASS — production build, 4 Rust tests, and 37 Playwright tests.
- `npx tsc -p frontend/tsconfig.json --noEmit`: PASS.
- `cargo fmt --all -- --check`: PASS.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- `/opt/fleet/lib/verify-url.sh https://lesson-code-room.sociobot.in <temp-dir>`: PASS.
- Independent deployed end-to-end and API audit: PASS.

## What would make this perfect

Nothing remains to change within the researched brief and factory contract. Preserve the current claim gate, isolated demo tenant, plain first screen, and route/accessibility regressions on future changes.
