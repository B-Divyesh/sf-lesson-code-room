# Adversarial first-read review 3 — FAIL

Date: 2026-08-29  
URL: <https://lesson-code-room.sociobot.in>  
Candidate reviewed: `ff9051f45aa4aa41497b775fd8255ed7dff700c4`  
Contexts: fresh Chromium at 390 × 844 and 1440 × 900; fresh local clone at `/tmp/lesson-code-room-review-3-mOKfX1`

## Verdict

**FAIL.** One P2 finding remains. The first-read, one-click demo, all 18 declared claim tests, full 36-test suite, privacy request log, responsive routes, and all earlier functional findings pass. A PASS requires zero findings.

## Cold first read

Before scrolling, both fresh contexts answer the three required questions.

| Question | What the first screen says |
| --- | --- |
| What does it do? | “Run one coding exercise together.” |
| For whom? | “For remote teachers who need learners coding now, with clear progress and no student accounts.” |
| What should I click first? | “Try it with sample data”; “A sample room opens with three learners.” |

At 390 px the full first action and its result are visible above the fold, `scrollWidth === clientWidth === 390`, and there were no ordinary console errors. The desktop view was also clear. The dark lamp-lit classroom art, asymmetric copy/art layout, clipped controls, amber focus/action color, and self-hosted Fraunces/Atkinson pairing are distinct and match `.factory/design.md`; this is not a generic SaaS template.

## Findings

### F-3-1 — P2: the designed 404 uses a metaphor instead of a plain error heading

**Quote/location:** Live `https://lesson-code-room.sociobot.in/missing-classroom` (HTTP 404) renders the only H1 as **“This page is not in the room”**. Source: `frontend/src/main.ts`, `renderErrorPage`.

The phrase depends on the product metaphor. A first-time visitor who follows a stale or mistyped link needs the direct result, not brand language. This violates the plain-words rule that an error says what happened and what to do next; the supporting paragraph does explain the next step, but the headline does not plainly say what happened.

**Concrete fix:** Change the H1 to **“Page not found”**. Keep the existing “Check the address or return to the lesson room home.” recovery sentence and Return home action. Add a route-copy assertion for the exact 404 H1.

## Copy audit

Whitespace-delimited counts. The landing table includes every visitor-facing sentence, heading, fact, label, action, and footer line; starter-code input is excluded because it is realistic editable sample data rather than landing prose. The README table includes every prose sentence; headings, command blocks, and URL-only links are labels rather than sentences. No audited landing or README item exceeds 22 words, uses a banned marketing adjective, has inconsistent product terminology, or uses a non-result-naming action. The only copy finding is the 404 heading above.

### Landing page

| Text | Words | Result |
| --- | ---: | --- |
| Run one coding exercise together | 5 | Pass |
| For remote teachers who need learners coding now, with clear progress and no student accounts. | 15 | Pass — `anonymous-room` |
| Try it with sample data | 5 | Pass — result-naming |
| A sample room opens with three learners. | 7 | Pass — `demo-sample-data` |
| No student accounts | 3 | Pass — `anonymous-room` |
| Rooms close after 24 hours | 5 | Pass — `room-retention` |
| Free for 10 learners | 4 | Pass — `free-capacity` |
| Teachers see screen names and Joined, Ran code, or Done. | 10 | Pass — `teacher-report-limits` |
| Set one exercise | 3 | Pass |
| Use the starter or paste your own HTML, CSS, and JavaScript. | 11 | Pass — `custom-room` |
| Learners each get an editable copy. | 6 | Pass — `custom-room` |
| Exercise title | 2 | Pass label |
| Instructions | 1 | Pass label |
| HTML | 1 | Pass label |
| CSS | 1 | Pass label |
| JavaScript | 1 | Pass label |
| Create room and join link | 5 | Pass — result-naming |
| Your room and starter code close after 24 hours. | 9 | Pass — `room-retention` |
| How the room works | 4 | Pass |
| Create the exercise | 3 | Pass |
| Set one task and starter page before the call. | 9 | Pass |
| Share one link | 3 | Pass |
| Learners choose a screen name and start in their browser. | 10 | Pass — `anonymous-room` |
| Watch simple progress | 3 | Pass |
| See who joined, ran code, or marked the task done. | 10 | Pass — `anonymous-room` |
| Teach without surveillance | 3 | Pass — section purpose is explained immediately below |
| Teachers see screen names and three progress states. | 8 | Pass — `teacher-report-limits` |
| They do not get grades or detailed activity reports. | 9 | Pass — `teacher-report-limits` |
| Runs HTML, CSS, and JavaScript only | 6 | Pass — `product-scope` |
| No automatic grading or detailed activity reports | 6 | Pass — `teacher-report-limits` |
| No repository imports or video calls | 6 | Pass — `product-scope` |
| For larger tutoring groups | 4 | Pass |
| Room Plus: $29 once | 4 | Pass — `paid-checkout` |
| Room Plus raises new rooms from 10 to 30 learners. | 10 | Pass — `paid-checkout` |
| Free rooms keep the 10-learner limit. | 6 | Pass — `paid-checkout` / `free-capacity` |
| Buy Room Plus | 3 | Pass — result-naming |
| Restore a license | 3 | Pass — result-naming |
| Verify license | 2 | Pass — result-naming |
| One-time purchase. | 2 | Pass — `paid-checkout` |
| Sociobot hosts the checkout. | 4 | Pass — `paid-checkout` |
| One exercise room for the first minutes of a live lesson. | 11 | Pass |
| Privacy | 1 | Pass link |
| Terms | 1 | Pass link |
| Built by Param Factory | 4 | Pass provenance |
| Original generated classroom art | 4 | Pass provenance |

### README

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

## Demo, claims, privacy, and structure checks

- One live click from the landing action reached `/?demo=1`. Before the API response completed, the page already showed **Make the night sky respond** with **Moss Finch — Done**, **Blue Comet — Ran code**, and **Quiet Fox — Joined**. The persistent **Demo — sample data, nothing is saved** banner, **Reset demo**, and **Start for real** were present.
- Reset changed the real demo learner URL from `DEMO-NZUYNG` to `DEMO-REYCYS`. Fresh demo browser `localStorage` and `sessionStorage` were empty. The request log contained only the product origin and the sandbox's opaque `null` origin; no third-party page, tracker, AI-provider, or payment request occurred in the demo flow.
- `.factory/claims.json` has 18 entries, each resolving to one `@claim:` test. In the fresh clone, `npm test -- --grep '@claim:'` passed all **18** claimed tests. `npm test` then passed the production build, 4 Rust tests, and all **36** Playwright tests. `npx tsc -p frontend/tsconfig.json --noEmit`, `cargo fmt --all -- --check`, and strict Clippy also passed.
- The landing and README factual product promises map to the declared inventory; no unlisted material visitor claim was found. Operational README statements are developer-run instructions and implementation details, not new visitor product promises.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200. `/missing-classroom` returned a designed HTTP 404. Every route had a route-specific title, one H1, `main`, description, canonical, OG/Twitter title, favicon, and mobile 200% reflow of `390/390`. The standard 404 resource error is the expected browser record for its HTTP status.
- All discovered internal links returned 200; Privacy email is `mailto:`; Param Factory returned 200; the Sociobot checkout returned its expected 303 to hosted Dodo checkout. Header/footer, legal links, robots, sitemap, original social image, skip link, reduced-motion treatment, visible route focus, and Back/Forward route focus work. Navigation to Demo focused its H1; Back focused the landing H1.
- The brief does not imply AI, import/export, or sync. No decorative AI feature or embedded provider key was found.

## Earlier-report verification

All prior `.factory/review-*.md`, `.factory/polish-*.md`, `.factory/verification*.md`, and the previous handoff were read. Each earlier finding was rechecked against current code and the live service.

| Earlier finding | Current verification |
| --- | --- |
| Verification P0: cross-replica rooms missing | Fixed: live demo learner `DEMO-*` link opens and works; source uses shared live and separate demo stores. |
| Verification P1: TypeScript check unavailable | Fixed: fresh `npx tsc -p frontend/tsconfig.json --noEmit` passes. |
| Verification P2: immutable assets uncached | Fixed: source and live header policy give hashed assets immutable caching. |
| Verification-2 P1: unlisted privacy/retention/payment/scope claims | Fixed: the present 18-entry inventory covers the retained material promises and tagged tests pass. |
| Verification-3 P1: learner reset unlisted | Fixed: `learner-reset` is declared and passed in the demo workbench. |
| Verification-4 P1: demo banner absent after join/workbench | Fixed: live demo banner, Reset, and Start for real persist through those views; covered by the suite. |
| Verification-4 P1: 404 contrast | Fixed: current 404 has no serious/critical Axe failure; 200% reflow is 390/390. |
| Verification-5 P1: stale async route overwrites Back | Fixed: live delayed-route Back/Forward behaviour and regression tests pass. |
| Verification-5 P1: paid capacity unproved | Fixed: `paid-checkout` fixture creates 30-capacity rooms and checks the 30/31 boundary. |
| Verification-5 P1: stale Rust builder contract | Fixed in current Dockerfile; current source uses the rolling compliant builder. |
| Verification-5 P2: privacy-email target | Fixed: `contact-link` has the target styling and prior Axe/touch regression coverage. |
| Verification-5 P2: wrong forwarded-address documentation | Fixed: README says right-most valid address, matching source. |
| Verification-6 P2: 200% phone overflow | Fixed: every audited public route measured 390/390 at 200% text. |
| Verification-6 P2: overload returns 500 | Fixed: contention maps to retryable 503 with `Retry-After`, guarded by Rust test. |
| F-1-1 | Fixed: static populated sample renders before `/api/demo` settles. |
| F-1-2 | Fixed: 200% 390 px reflow passes on landing, demo, legal pages, and 404. |
| F-1-3 | Fixed: unsupported private-screen promise is removed; teacher-visible states are claimed. |
| F-1-4 | Fixed: route metadata updates OG and Twitter values. |
| F-1-5 | Fixed: hero slogan removed. |
| F-1-6 | Fixed: context-free creator eyebrow removed. |
| F-1-7 | Fixed: context-free process eyebrow removed. |
| F-1-8 | Fixed: “A room, not a watchtower” removed. |
| F-1-9 | Fixed: README test explanation is split into 11- and 10-word sentences. |
| F-1-10 | Fixed: README container explanation is split into 14- and 9-word sentences. |
| F-2-1 | Fixed: demo IDs use `DEMO-` and source selects the isolated demo tenant rather than live storage. |
| F-2-2 | Fixed: `demo-sample-data` inventories and asserts exactly three named first-render states. |

## What would make this perfect

Use **Page not found** as the 404 H1 and add the small route-copy regression test. Then rerun the full first-read review. No other product change is indicated by this pass.
