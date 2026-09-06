# Run one coding exercise — review 6 — PASS

Date: 2026-09-06

Work order: `lesson-code-room-review-6`

Live URL: <https://lesson-code-room.sociobot.in>

Implementation candidate reviewed: `8cfa5ff067bf28426a8e12c3185a52af5360f056`

Documentation SHA reviewed: `9a4678e29ff11aac1644e96cc8f8c257254b6e99`

Live `/health` SHA: `445a9aacb5d2d6a4c87330547a98347448653897`

## Verdict

**PASS.** Finding count: **0**. Untested claim count: **0**.

The live health SHA is the earlier documentation-only handoff commit. `git diff`
from the implementation candidate to the documentation SHA contains only
`.factory/handoff.md` and `.factory/verification-10.md`; no product source,
frontend asset source, dependency, or deployment configuration changed.

## First screen

Fresh Chromium contexts at 390 × 844 and 1440 × 900 had `scrollY` 0 and no
horizontal overflow before any scrolling. Both showed:

| Check | Result |
| --- | --- |
| Job | “Run one coding exercise together” |
| Audience | “For remote teachers who need learners coding now, with clear progress and no student accounts.” |
| First action | “Try it with sample data” |

Both contexts had no browser console errors. The action was visible on the
first screen in each context.

## Sample and real-data boundary

Opening `/demo` showed the populated **Make the night sky respond** room with
Moss Finch — Done, Blue Comet — Ran code, and Quiet Fox — Joined. The banner
remained visible: **Demo — sample data, nothing is saved**, with **Reset demo**
and **Start for real**. Reset changed the learner room link.

The clean-checkout `demo-storage-isolation` claim test passed separately. It
creates and reads a live room before and after demo use, and proves the demo
uses a `DEMO-` in-memory store without changing the live room. The complete
suite also passed the demo banner through join and workbench, learner editing,
preview, Done, reset starter code, offline preview, and privacy paths.

## Claims and local checks

A fresh clone at `9a4678e` completed `npm ci` with zero audit vulnerabilities.
Every exact command in `.factory/claims.json` passed separately:

`anonymous-room`, `custom-room`, `sandbox-run`, `demo-reset`,
`demo-storage-isolation`, `demo-sample-data`, `learner-reset`, `privacy-code`,
`teacher-report-limits`, `product-scope`, `no-tracking`, `session-storage`,
`offline-preview`, `rate-limit`, `free-capacity`, `room-retention`,
`demo-retention`, and `paid-checkout`.

The full clean-checkout `npm test` result was passed: 6 Rust tests and 36
Playwright tests. These additional declared quality commands passed:

```sh
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

The release binary was produced and `dist/` was produced. The built JavaScript
is 31.00 kB raw / 9.72 kB gzip and CSS is 18.97 kB raw / 4.96 kB gzip.

## Live checks

- `/health` returned HTTP 200 and the SHA above.
- `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and
  `/sandbox.html` returned HTTP 200.
- `/not-a-room` deliberately returned HTTP 404. It is the expected designed
  not-found route, not a finding.
- The factory URL check passed: title, `lang=en`, one H1, main landmark, image
  alternatives, named buttons, and zero console errors.
- Fresh live Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and
  `/not-a-room` found zero serious or critical violations.
- A 60-request `/api/demo` burst returned 13 HTTP 200 and 47 HTTP 429. Every
  429 included `Retry-After: 1`.
- The prior authoritative verification report records live SQLite restart
  persistence for a real room, in-memory demo removal after restart, tenant
  isolation, invalid and boundary validation, 10/11 free capacity, checkout
  handling, headers, and 100-request health allowance. This remains applicable
  because the implementation candidate is unchanged.

## Earlier findings

All earlier review, verification, and polish reports were read. Their current
disposition is proved by the unchanged implementation, this clean test run,
and the current live checks.

| Earlier finding | Current disposition |
| --- | --- |
| Cross-request room loss | Fixed; prior live restart and separate-context flow passed. |
| Missing TypeScript gate | Fixed; the clean TypeScript command passed. |
| Hashed asset caching | Fixed; source test and prior live check passed. |
| Missing claims | Fixed; all 18 declared claim commands passed once each. |
| Demo banner disappeared | Fixed; full suite and live demo retain it. |
| 404 contrast or metaphor text | Fixed; designed 404 is plain and has zero serious/critical Axe issues. |
| Back or Forward race | Fixed; full suite passed the delayed navigation cases. |
| Paid 30-learner capacity was unproved | Fixed; recorded-valid claim test passed. |
| Pinned Rust builder | Fixed; Dockerfile keeps `rust:1-slim`. |
| Privacy email target too small | Fixed; target regression remains in the passing suite. |
| Forwarded-address documentation | Fixed; implementation and README agree. |
| 200% phone overflow or footer overlap | Fixed; responsive regression remains in the passing suite. |
| Overload returned HTTP 500 | Fixed; current live burst returned only 200 and retryable 429 responses. |
| Demo first showed a loading state | Fixed; current `/demo` rendered the populated sample. |
| Demo shared the durable store | Fixed; isolation claim passed from the clean checkout. |
| Deep-route metadata | Fixed; route metadata regression remains in the passing suite. |
| Vague, metaphorical, or overlong copy | Fixed; the current first screen is direct and the copy audit remains clean. |
| Blob storage instead of SQLite `/data` | Fixed; prior live restart proof applies to the unchanged candidate. |

## Result

**PASS.** There are zero findings at every severity and zero untested public
claims. No product code was changed in this review.
