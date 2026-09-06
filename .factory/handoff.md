# Lesson Code Room handoff

Date: 2026-09-06

Work order: `lesson-code-room-review-6`

Live URL: <https://lesson-code-room.sociobot.in>

Implementation verified: `8cfa5ff067bf28426a8e12c3185a52af5360f056`

Documentation SHA reviewed: `9a4678e29ff11aac1644e96cc8f8c257254b6e99`

Live `/health` SHA: `445a9aacb5d2d6a4c87330547a98347448653897`

## Result

**PASS.** Fresh review found zero findings and zero untested claims. No product code changed.

The live health SHA is the earlier documentation-only handoff commit. The only
changes from the implementation candidate to this documentation SHA are
`.factory/handoff.md` and `.factory/verification-10.md`; product code is
unchanged.

## Verification summary

- Fresh phone and desktop contexts clearly showed the job, remote-teacher audience, and **Try it with sample data** before scrolling.
- The one-click sample showed all three named learner states. The demo label and controls persisted through join and workbench views.
- Learner editing, preview, Done, offline preview, starter reset, and demo reset passed. Demo use did not alter the live QA room.
- Live normal, invalid, maximum-length, room-capacity, credential-isolation, recovery, privacy, and security paths passed.
- A managed restart of the single `sf-lesson-code-room` replica preserved a live SQLite room and removed an in-memory demo room.
- A 60-request live burst produced 47 HTTP 429 responses, all with `Retry-After: 1`, then recovered after 1.1 seconds.
- All public routes, metadata, links, legal pages, the deliberate designed 404, keyboard navigation, 200% text, reduced motion, and Axe checks passed.
- Lighthouse mobile: 99 performance, 100 accessibility, 100 best practices, 100 SEO.
- All 18 claim commands passed separately from a clean checkout. The full suite passed 6 Rust and 36 Playwright tests.
- The clean TypeScript, Rust format, strict Clippy, release-build, and frontend-build commands passed.
- Fresh live `/`, `/demo`, legal, 404, URL-check, Axe, and rate-limit checks passed. The 60-request burst returned 47 HTTP 429 responses with `Retry-After: 1`.

Full evidence and cumulative finding dispositions are in [review-6.md](review-6.md).

## Run locally

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

For a no-config runtime check:

```sh
npm run build
PORT=8080 cargo run
curl http://localhost:8080/health
```

With `/data` mounted, live state uses `/data/lesson-code-room-v2.db`. Without `/data`, local runs use `data/lesson-code-room-v2.db`. Demo rooms remain process-memory-only.

## Known limits and next steps

- Live rooms expire after 24 hours; demos expire after two hours.
- The locked legacy `/data/lesson-code-room.db` remains untouched. Current rooms use `lesson-code-room-v2.db`; former Blob data is not migrated.
- Room Plus remains dependent on factory billing registration. The hosted checkout, invalid-license path, recorded-valid verification, and 30/31 capacity boundary pass; no purchase was made during QA.
- No release-blocking or minor product work remains.
