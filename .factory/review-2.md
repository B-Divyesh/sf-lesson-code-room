# Adversarial first-read review 2 — FAIL

Date: 2026-08-29
URL: <https://lesson-code-room.sociobot.in>
Contexts: fresh Chromium contexts at 390 × 844 and 1440 × 900; fresh clean clone at `615cf1b`

## Verdict

**FAIL.** The first-read, phone layout, route structure, declared claim tests, and visual identity pass. Two findings remain: demo data is written to the production room store, and one numerical landing claim is not declared in `.factory/claims.json`. A PASS requires zero findings and no untested claim.

## Cold first read

Before scrolling, both the 390 px and desktop views answered all three required questions.

- **What it does:** “Run one coding exercise together.”
- **For whom:** “For remote teachers who need learners coding now, with clear progress and no student accounts.”
- **First click:** “Try it with sample data”; “A sample room opens with three learners.”

The first screen is legible at 390 px (`scrollWidth` = 390), has no console errors, and uses the supplied lamp-lit classroom direction rather than a generic SaaS layout. The oblique art/copy layout, dark teal work surfaces, amber controls, clipped corners, Fraunces display face, and original classroom art match `.factory/design.md`.

## Findings

### F-2-1 — BLOCKING: demo rooms are persisted in the production room store

**Quote/location:** The persistent banner says, “Demo — sample data, nothing is saved” (`frontend/src/main.ts:366`). The server's `create_demo` calls `insert_room(&state.store, input, false, true)` (`src/main.rs:735-765`). `insert_room` writes demo and live rooms through the same `Store`; for the deployment store it writes the same `rooms/{id}` Blob path (`src/main.rs:773-815`), and the local backend path inserts both into the same `rooms` table with only an `is_demo` flag (`src/main.rs:1043-1074`, `migrations/0001_rooms.sql:1-13`).

The sample data has a two-hour TTL and does not alter an existing live row, but it is still written to the real shared storage namespace. That fails the demo-sandbox contract: demo must use an ephemeral tenant/in-memory store or a separate storage namespace where production data is unreachable. A first-time visitor is told that the sample is isolated while their demo join/progress activity creates persistent rows alongside live rooms.

**Concrete fix:** Provision demo rooms in a dedicated, separately named demo store/tenant (or an in-memory, TTL-managed demo store). Keep its identifiers and participants under a separate namespace, and make production room operations unable to resolve it. Replace the current `demo: bool` shared-store branch. Add `@claim:demo-storage-isolation` that creates a demo, joins/runs it, and proves no live-store room/participant write occurred; retain the current reset test for the visible behavior.

### F-2-2 — P2: the landing promise of exactly three sample learners is unlisted

**Quote/location:** “A sample room opens with three learners.” (`frontend/src/main.ts:121`).

This is a specific, user-relevant numerical claim. `.factory/claims.json` has no claim stating that the sample opens with three learners. `demo-reset` promises only temporary sample data and a fresh room; its test happens to inspect seeded names but does not inventory the advertised count. The claim gate therefore cannot show a visitor which declared claim proves this promise.

**Concrete fix:** Add a `demo-sample-data` claim such as “A sample room opens with three named learner progress states,” tag the existing first-render test `@claim:demo-sample-data`, and assert exactly Moss Finch/Done, Blue Comet/Ran code, and Quiet Fox/Joined before the `/api/demo` response resolves. Alternatively, remove “with three learners” from the landing sentence.

## Copy audit

Whitespace-delimited word counts. The landing table includes meaningful headings, labels, actions, and footer copy; code samples are excluded as product input. No landing copy exceeds 22 words, uses a banned marketing adjective, has inconsistent terminology, or has a non-result-naming action. The sole claim-inventory exception is F-2-2.

### Landing page

| Text | Words | Result |
| --- | ---: | --- |
| Run one coding exercise together | 5 | Pass |
| For remote teachers who need learners coding now, with clear progress and no student accounts. | 15 | Pass |
| Try it with sample data | 5 | Pass |
| A sample room opens with three learners. | 7 | F-2-2 |
| No student accounts | 3 | Pass |
| Rooms close after 24 hours | 5 | Pass |
| Free for 10 learners | 4 | Pass |
| Teachers see screen names and Joined, Ran code, or Done. | 10 | Pass |
| Set one exercise | 3 | Pass |
| Use the starter or paste your own HTML, CSS, and JavaScript. | 11 | Pass |
| Learners each get an editable copy. | 6 | Pass |
| Exercise title | 2 | Pass |
| Instructions | 1 | Pass |
| HTML | 1 | Pass |
| CSS | 1 | Pass |
| JavaScript | 1 | Pass |
| Create room and join link | 5 | Pass |
| Your room and starter code close after 24 hours. | 9 | Pass |
| How the room works | 4 | Pass |
| Create the exercise | 3 | Pass |
| Set one task and starter page before the call. | 9 | Pass |
| Share one link | 3 | Pass |
| Learners choose a screen name and start in their browser. | 10 | Pass |
| Watch simple progress | 3 | Pass |
| See who joined, ran code, or marked the task done. | 10 | Pass |
| Teach without surveillance | 3 | Pass |
| Teachers see screen names and three progress states. | 8 | Pass |
| They do not get grades or detailed activity reports. | 9 | Pass |
| Runs HTML, CSS, and JavaScript only | 6 | Pass |
| No automatic grading or detailed activity reports | 6 | Pass |
| No repository imports or video calls | 6 | Pass |
| For larger tutoring groups | 4 | Pass |
| Room Plus: $29 once | 4 | Pass |
| Room Plus raises new rooms from 10 to 30 learners. | 10 | Pass |
| Free rooms keep the 10-learner limit. | 6 | Pass |
| Buy Room Plus | 3 | Pass |
| Restore a license | 3 | Pass |
| Verify license | 2 | Pass |
| One-time purchase. | 2 | Pass |
| Sociobot hosts the checkout. | 4 | Pass |
| One exercise room for the first minutes of a live lesson. | 11 | Pass |
| Privacy | 1 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory | 4 | Pass |
| Original generated classroom art | 4 | Pass |

### README

All prose sentences are at or below 22 words. Technical terms (SQLite, CSP, ingress, managed identity, and replicas) occur only in the developer operation/security sections and are appropriate there; no rewrite is required for first-use product copy.

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
| Open temporary sample data through `/demo` without changing live rooms. | 10 | Pass |
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

README headings and command/URL-only lines are labels rather than sentences. They are descriptive and pass.

## Demo, claim, privacy, and structure checks

- The one-click action reached `/?demo=1`; its first rendered screen already showed **Make the night sky respond**, Moss Finch (Done), Blue Comet (Ran code), and Quiet Fox (Joined). The demo banner, Reset demo, and Start for real were visible. Reset changed the learner URL from `UCUDUK` to `KZPJDX`. This passes the visible demo experience, but does not cure F-2-1's backend persistence.
- In the fresh browser context, demo localStorage and sessionStorage were empty before joining. The demo request log contained only `https://lesson-code-room.sociobot.in` plus the sandbox's non-network `null` origin. No tracker or external AI/provider request was observed.
- In clean clone `/tmp/lesson-code-room-review-2`, `npm ci` passed. All 16 exact commands referenced by `.factory/claims.json` passed independently; the final `test-results/.last-run.json` recorded `{"status":"passed","failedTests":[]}`. The full `npm test` run also passed (3 Rust tests and 35 Playwright tests). No declared claim test failed. F-2-1 is a sandbox-isolation gap not asserted by the current suite; F-2-2 is an undeclared claim.
- `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/favicon.svg`, and `/apple-touch-icon.png` returned 200. An unknown route returned designed HTML 404 with a return-home action. All discovered internal links, the Param Factory link, and the hosted checkout resolved successfully. The checkout may redirect but resolves to 200.
- At 390 px and 200% root text, `/`, `/demo`, `/privacy`, `/terms`, and the 404 each had `scrollWidth === clientWidth === 390`. Each public route has one H1 and main landmark, correct title/description/canonical, route-specific Open Graph/Twitter text, and no ordinary load console errors. The 404's HTTP 404 naturally appears as a browser resource message.
- Favicon, Apple touch icon, robots, sitemap, CSP, Permissions-Policy camera/microphone blocking, skip link, legal footer, focus route handling, reduced-motion styles, and distinct visual identity are present. The product brief does not imply AI, import/export, or sync; no decorative AI feature or embedded provider key was found.

## Earlier finding verification

Read `.factory/review-1.md`, `.factory/polish-1.md`, and the preceding handoff. There were no review/polish reports before review 1. Each review-1 finding was rechecked on the live app and against the implementation:

| Earlier finding | Current verification |
| --- | --- |
| F-1-1 | Fixed: `renderDemoPreview` paints populated sample data synchronously before `/api/demo` resolves. |
| F-1-2 | Fixed: 390 px at 200% text has no horizontal overflow on all five audited routes. |
| F-1-3 | Fixed: the untested “private screens” wording is gone; the replacement is tagged to `teacher-report-limits`. |
| F-1-4 | Fixed: `setMeta` updates OG and Twitter title/description; live route audit confirmed every public route. |
| F-1-5 | Fixed: the information-free hero eyebrow is absent. |
| F-1-6 | Fixed: “The real first step” is absent. |
| F-1-7 | Fixed: “A short teaching loop” is absent. |
| F-1-8 | Fixed: “A room, not a watchtower” is absent. |
| F-1-9 | Fixed: the README test explanation is two sentences of 11 and 10 words. |
| F-1-10 | Fixed: the README storage explanation is two sentences of 14 and 9 words. |

## What would make this perfect

Move demo state to an actually isolated ephemeral store and prove that boundary with a claim test. Inventory and test the advertised three-learner sample. Then rerun the complete clean-clone claim gate and this full first-read review.
