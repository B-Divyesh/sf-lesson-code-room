# Adversarial first-read review 1 — FAIL

Date: 2026-08-29  
URL: https://lesson-code-room.sociobot.in  
Contexts: fresh 390 × 844 mobile and 1440 × 900 desktop

## Verdict

**FAIL.** The core teacher/learner journey, 16 declared claims, normal-phone layout, and privacy request log pass. Three blocking findings and seven further findings remain. A PASS requires zero findings.

## Cold first read

Before scrolling, both contexts made the job clear:

- What: **“Run one coding exercise together.”**
- For whom: **“For remote teachers who need learners coding now, with clear progress and no student accounts.”**
- First action: **“Try it with sample data”**, with **“A sample room opens with three learners.”**

The normal landing first read passes. The lamp-lit classroom art, clipped desk-like controls, dark blue/amber palette, and display type are distinct and match `.factory/design.md`; this is not a generic SaaS template.

## Findings

### F-1-1 — BLOCKING: first demo screen is a loading screen, not sample use

**Quote/location:** Fresh mobile click on **Try it with sample data** reached `/demo` and first rendered `Opening the sample room` and `This takes one short moment.` (`frontend/src/main.ts:296-305`).

The required first screen after the one-click action must already show realistic sample use. This screen has no exercise, learner states, or usable workbench. Render a populated static sample teacher room synchronously, then bind it to the isolated provisioned room; add a test that checks the sample before waiting for `/api/demo`.

### F-1-2 — BLOCKING: 200% text forces horizontal panning on a phone

**Evidence/location:** This reopens the earlier handoff P2 text-reflow finding. At 390 px with root text set to 200%, live `/`, `/privacy`, and `/terms` each measured `scrollWidth: 450`; `/demo` measured `489`; `clientWidth` stayed 390. Relevant fixed width/gap rules include `frontend/src/styles.css:68-76` and `:136-138`.

A low-vision phone visitor must pan sideways to read and operate the product. Remove/cap rem-scaled minimums and gaps, let header/demo controls wrap, and regression-test `scrollWidth <= clientWidth` for landing, Demo, Privacy, and Terms at 390 px and 200% text.

### F-1-3 — BLOCKING: private-screen promise is not an inventoried claim

**Quote/location:** `See the room, not private screens.` (`frontend/src/main.ts:114`).

This tells a teacher that private learner screens cannot be exposed. No `claims.json` entry tests that promise: `teacher-report-limits` checks progress response fields and `privacy-code` checks one progress payload. Remove it, or replace it with the already-tested `Teachers see screen names and Joined, Ran code, or Done.` and mark it `data-claim="teacher-report-limits"`. If retaining the stronger promise, add a dedicated claim and demo assertion proving all teacher-visible data and absence of learner edits/screens.

### F-1-4 — P2: deep routes retain landing social metadata

Fresh `/privacy`, `/terms`, `/demo`, and `/missing-classroom` correctly set title, description, and canonical but retain the landing `og:title`, `og:description`, `twitter:title`, and `twitter:description`. `setMeta` (`frontend/src/main.ts:23-27`) only updates three fields. Update OG/Twitter fields for every route and test deep links, including 404.

### F-1-5 — P2: hero eyebrow is an information-free slogan

**Quote:** `One room. One exercise. Start teaching.` (6 words, `main.ts:97`). It carries no useful information beyond the headline. Delete it or use `Shared HTML, CSS, and JavaScript exercise for a live lesson.`

### F-1-6 — P2: context-free heading

**Quote:** `The real first step` (4 words, `main.ts:121`). It does not name the section. Delete it; `Set one exercise` already does.

### F-1-7 — P2: context-free heading

**Quote:** `A short teaching loop` (4 words, `main.ts:141`). It does not name the content. Delete it; `How the room works` already does.

### F-1-8 — P2: unexplained metaphor heading

**Quote:** `A room, not a watchtower` (5 words, `main.ts:153`). “Watchtower” is mood language rather than a section name. Replace with `What teachers can see`, or delete it.

### F-1-9 — P2: README sentence exceeds 22 words

**Quote:** `This exact command builds dist/, runs Rust unit tests, starts the production server on port 4174, and runs Playwright claim and accessibility tests.` (23 words).

Rewrite: `This command builds dist/, runs Rust tests, and starts the production server. It then runs Playwright claim and accessibility tests on port 4174.`

### F-1-10 — P2: README container sentence exceeds 22 words

**Quote:** `In the factory container environment it uses its managed identity to store room records in the dedicated shared Azure Blob container, so a learner and teacher can reach different replicas safely.` (31 words).

Rewrite: `In the factory container, the service uses its managed identity for the shared room store. Teacher and learner requests can reach different replicas safely.`

## Copy audit

Counts use whitespace-delimited words. HTML/CSS/JS sample input is excluded as realistic product input, not prose. Headings, labels, and actions are included.

### Landing

| Text | Words | Result |
| --- | ---: | --- |
| One room. One exercise. Start teaching. | 6 | F-1-5 |
| Run one coding exercise together | 5 | Pass |
| For remote teachers who need learners coding now, with clear progress and no student accounts. | 15 | Pass |
| Try it with sample data | 5 | Pass/result-naming |
| A sample room opens with three learners. | 7 | Pass |
| No student accounts | 3 | Pass |
| Rooms close after 24 hours | 5 | Pass |
| Free for 10 learners | 4 | Pass |
| See the room, not private screens. | 6 | F-1-3 |
| The real first step | 4 | F-1-6 |
| Set one exercise | 3 | Pass |
| Use the starter or paste your own HTML, CSS, and JavaScript. | 11 | Pass |
| Learners each get an editable copy. | 6 | Pass |
| Exercise title | 2 | Pass label |
| Instructions | 1 | Pass label |
| HTML | 1 | Pass label |
| CSS | 1 | Pass label |
| JavaScript | 1 | Pass label |
| Create room and join link | 5 | Pass/result-naming |
| Your room and starter code close after 24 hours. | 9 | Pass |
| A short teaching loop | 4 | F-1-7 |
| How the room works | 4 | Pass |
| Create the exercise | 3 | Pass |
| Set one task and starter page before the call. | 9 | Pass |
| Share one link | 3 | Pass |
| Learners choose a screen name and start in their browser. | 10 | Pass |
| Watch simple progress | 3 | Pass |
| See who joined, ran code, or marked the task done. | 10 | Pass |
| A room, not a watchtower | 5 | F-1-8 |
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
| Buy Room Plus | 3 | Pass/result-naming |
| Restore a license | 3 | Pass/result-naming |
| Verify license | 2 | Pass/result-naming |
| One-time purchase. | 2 | Pass |
| Sociobot hosts the checkout. | 4 | Pass |
| One exercise room for the first minutes of a live lesson. | 11 | Pass |
| Privacy | 1 | Pass link label |
| Terms | 1 | Pass link label |
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
| Open temporary sample data through `/demo` without changing live rooms. | 10 | Pass |
| Restore a Room Plus license through Sociobot billing. | 8 | Pass |
| Room Plus costs $29 once and raises new rooms to 30 learners. | 12 | Pass |
| Requirements: Node.js 22+, npm, Rust 1.89+, and a Chromium browser for Playwright. | 12 | Pass |
| Open `http://localhost:8080`. | 2 | Pass |
| Outside Azure, the server creates `data/lesson-code-room.db`. | 6 | Pass |
| Supplying `DATABASE_URL` also selects SQLite, which is useful for isolated local tests. | 12 | Pass |
| Vite runs on `http://localhost:5173` and proxies `/api` to the Rust server. | 11 | Pass |
| This exact command builds `dist/`, runs Rust unit tests, starts the production server on port 4174, and runs Playwright claim and accessibility tests. | 23 | F-1-9 |
| Playwright is pinned to 1.58.2. | 5 | Pass |
| Run one documented claim: | 4 | Pass |
| The claims and their sandbox evidence are listed in `.factory/claims.json`. | 10 | Pass |
| Demo behavior is documented in `.factory/demo.md`. | 6 | Pass |
| The image runs as a non-root user, listens on `PORT` (default `8080`), and serves the built frontend from the same process. | 21 | Pass |
| In the factory container environment it uses its managed identity to store room records in the dedicated shared Azure Blob container, so a learner and teacher can reach different replicas safely. | 31 | F-1-10 |
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
| MIT. See `LICENSE`. | 3 | Pass |
| Bundled font notices are in `THIRD_PARTY_NOTICES.md`. | 6 | Pass |

README headings name their sections; command blocks and URL-only links are not sentences.

## Demo, claims, privacy, and structure checks

- Once provisioned, `/demo` showed the persistent `Demo — sample data, nothing is saved` banner, Reset demo, Start for real, realistic **Make the night sky respond** data, and seeded Moss Finch (Done), Blue Comet (Ran code), and Quiet Fox (Joined). The learner link retained the banner through join and editable workbench. Reset changed `CGHMDN` to `BWCDWZ`.
- Before joining, demo browser storage was empty. Demo learner state was tab-scoped `sessionStorage` (`learner:CGHMDN`), not localStorage; demo rooms are separately marked temporary. The full demo request log used only the product origin (plus non-network `null` sandbox origin).
- In clean clone `/tmp/lesson-code-room-review-lwXoNq`, `npm ci` passed (26 packages, 0 vulnerabilities); all 16 exact `claims.json` commands passed independently; `npm test` passed (32 Playwright tests); `npx tsc -p frontend/tsconfig.json --noEmit` passed. No declared claim test failed or went untested.
- `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and `/sandbox.html` returned 200; unknown route returned designed 404. Discovered internal links returned 200, checkout returned expected 303, and the email is explicit `mailto:`. Title/lang/H1/main/favicon/canonical/social image/reduced motion/focus/footer/legal links are present.
- No AI, import/export, or sync feature is implied by this one-room live-lesson brief. AI is appropriately absent and no provider key is embedded.

## Earlier-report verification

There are no earlier `review-*` or `polish-*` files. Every `.factory/verification*.md` and the prior handoff was read. Former cross-replica storage, claim inventory/reset, demo-banner, 404 contrast, Back/Forward race, paid-capacity, Docker base image, privacy target, and README forwarded-address findings are fixed in current source/live behavior and covered by the suite. The prior 200% reflow P2 is not fixed (F-1-2). A fresh 60-request live same-client join burst returned 7 × 200, 19 × 409, 34 × 429, and **0 × 500**, so the prior overload-500 finding did not reproduce.

## What would make this perfect

Open Demo directly into a populated usable sample room; remove 200% horizontal overflow; narrow or test the private-screen promise; update route social metadata; remove the four information-free eyebrows; and split the two overlong README sentences. Then rerun this whole review.
