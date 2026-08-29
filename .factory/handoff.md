# Lesson Code Room — polish 2 handoff

Date: 2026-08-29  
Repair commit: `5f6c09eb282f0e695d4f68d485d658fb5923ef24`

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
- Fresh clone `/tmp/lesson-code-room-clean-ivf5Te`: `npm ci`, all 18 exact
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

## Known gaps

None. The final live cold-check and deployment identity are appended after the
work-order deployment completes.
