# Lesson Code Room — polish 2 handoff

Date: 2026-08-29  
Primary repair commit: `5f6c09eb282f0e695d4f68d485d658fb5923ef24`  
Production namespace correction: `6b7abd743ba0bd575c35b1afdfc6d2d0d261b101`

## Result

The demo now uses an isolated tenant. Local and test runs hold it in memory.
The deployed service uses the separate `lesson-code-room-demo` Blob container,
so demo traffic can use any replica without touching the live-room container.
Demo IDs use the `DEMO-` namespace. The first render still shows the realistic
three-learner sample immediately.

The new `demo-storage-isolation` and `demo-sample-data` entries complete the
claim inventory. The older review fixes remain covered: first-read wording,
metadata, real routing, legal/footer links, 404, focus movement, keyboard,
200% text reflow, mobile targets, offline preview, privacy, and the persistent
demo banner. Blob lease contention now gives a retryable 503 response instead
of a 500.

## Verification

- `npm test` — pass: Vite build, 4 Rust tests, and 36 Playwright tests.
- `npx tsc -p frontend/tsconfig.json --noEmit` — pass.
- `cargo fmt --check` — pass.
- `cargo clippy --all-targets -- -D warnings` — pass.
- `cargo build --locked --release` — pass.
- Fresh clone `/tmp/lesson-code-room-final-UM4Sx3`: `npm ci`, all 18 exact
  commands in `.factory/claims.json`, the complete `npm test`, TypeScript,
  formatting, clippy, and release build — pass.
- Build budgets: JavaScript 31.01 KB raw / 9.72 KB gzip; CSS 18.92 KB raw /
  4.95 KB gzip; bundled fonts 71.35 KB. No remote fonts or page trackers.

## Run and deploy

Run `npm ci && npm test` for the complete local suite. For manual use, run
`npm run build` and then `PORT=8080 cargo run`; open `/?demo=1`.

Deploy with `/opt/fleet/lib/deploy-container.sh lesson-code-room /work/repo Dockerfile 8080`.
The app needs only `PORT`; live rooms choose managed-identity Blob storage,
while a non-Azure boot falls back to SQLite.

## Deployment and live cold-check

Deployed through the work-order container configuration. `GET /health` at
<https://lesson-code-room.sociobot.in/health> returned build
`6b7abd743ba0bd575c35b1afdfc6d2d0d261b101`.

Cold Chromium checks at 390 px confirmed `/`, `/privacy`, `/terms`, and the
real 404 have their expected status, route title, one H1, and no horizontal
overflow. `/?demo=1` showed the banner, Reset demo, Start for real, and the
three named sample learners. A live `POST /api/demo` returned
`storage: "demo-blob"` with a `DEMO-` identifier; that learner link opened the
screen-name form. `/opt/fleet/lib/verify-url.sh` passed against the landing
page with no console errors and title/lang/main/alt checks. Screenshots:
`/tmp/lesson-code-room-polish-2-landing.png`,
`/tmp/lesson-code-room-polish-2-demo.png`, and
`/tmp/lesson-code-room-polish-2-404.png`.

The standalone axe CLI could not start its Selenium Chrome driver in this
container. The product's Playwright Axe suite passed all public routes and the
join/workbench states in `npm test`.

## Known gaps

None.
