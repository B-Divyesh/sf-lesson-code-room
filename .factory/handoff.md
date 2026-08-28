# Lesson Code Room v1 handoff

Build date: 2026-08-28

Work order: `lesson-code-room-build-1`

Artifact: `web-with-backend`

## What shipped

- A complete room flow for one live HTML, CSS, and JavaScript exercise.
- Teacher creation with starter code, instructions, a six-letter room code, a learner link, and a private teacher token.
- No-account learner entry with a chosen or random screen name.
- A keyboard-operable three-file editor with run, confirmed reset, and done actions.
- Teacher progress signals for Joined, Ran code, and Done, refreshed every 2.5 seconds.
- Free room capacity of 10 learners and a verified Room Plus capacity of 30.
- Live-room expiry after 24 hours and demo-room expiry after two hours, with startup and 15-minute cleanup.
- A one-click `/demo` with a sample night-sky task and three seeded learners.
- A persistent demo banner with Reset demo and Start for real actions.
- A Sociobot checkout link, browser license restore, daily verdict cache, and server-side license verification.
- `/privacy`, `/terms`, and an in-product styled 404 route.
- A responsive cinematic classroom identity, generated hero image, social card, favicon, and self-hosted fonts.
- An axum server with SQLite migrations, structured logs, graceful shutdown, security headers, and per-IP API rate limits.
- A multi-stage, non-root Dockerfile that uses the factory `BUILD_SHA` argument.

## Sandbox and security

Learner output runs in an iframe with `sandbox="allow-scripts"` and no same-origin permission. A dedicated runner loads first, then installs a second CSP before lesson code runs. The resulting policy blocks connections, forms, nested frames, remote images, media, fonts, and base URL changes. Automated tests attempt both external fetch and same-origin script loading.

Teacher keys travel in URL fragments, which browsers do not send in HTTP requests. The current tab keeps the key in session storage. Progress requests send it in a request header, so server request logs do not contain it.

## Verification

All checks were run from `/work/repo`.

| Check | Result |
| --- | --- |
| `npm test` | Passed: 2 Rust unit tests and 11 Playwright tests |
| Claim tests | Passed: anonymous join, sandbox execution, demo reset, private learner edits, retention, capacity, and paid contract |
| Accessibility | Axe: no serious or critical findings on landing, demo, privacy, terms, join, or workbench |
| Keyboard | Editor tab arrow navigation is covered in Playwright |
| Mobile | 390 × 844 layout has no horizontal overflow |
| `npm run build` | Passed; output written to `dist/` |
| `cargo clippy --all-targets -- -D warnings` | Passed |
| `cargo build --release --locked` | Passed |
| `npm audit --audit-level=high` | Passed; 0 vulnerabilities |
| Clean runtime | Release binary started with an empty environment plus `PORT`; `/health` returned 200 |
| Route status | `/demo`, `/privacy`, and `/terms` return 200 on direct load |
| Load smoke | 100 concurrent `/health` requests returned 200 in 0.389 seconds |

### Asset budgets

- Initial JavaScript: 27.02 KB raw, 8.87 KB gzip.
- CSS: 17.50 KB raw, 4.71 KB gzip.
- Fonts: 71.35 KB across three WOFF2 files.
- Hero art: 56 KB desktop and 24 KB mobile WebP.
- Social image: 32 KB WebP at 1200 × 630.

### Lighthouse mobile

Measured against the production build on localhost with Lighthouse 12.8.2 and headless Chromium:

- Performance: 99
- Accessibility: 100
- Best practices: 100
- SEO: 100
- LCP: 1.8 s
- CLS: 0.021
- Total blocking time: 0 ms

## Run and deploy

```sh
npm install
npm test
npm run build
PORT=8080 cargo run --release
```

Container build command:

```sh
docker build --build-arg BUILD_SHA=<source-commit> -t lesson-code-room .
```

The container needs only `PORT`; its default is 8080. It serves the frontend and API together and stores SQLite data at `/data/lesson-code-room.db`.

## Known gaps and release steps

- Docker is not installed in the worker image, so the Dockerfile could not be executed locally. Both build stages were verified separately with `npm run build` and `cargo build --release --locked`.
- The factory must register `lesson-code-room` with Sociobot billing before the live purchase can complete. The checkout URL, restore flow, browser verification, and server verification contract are implemented; automated tests use a recorded valid response.
- SQLite is appropriate for one persistent container. A multi-replica deployment would need a shared PostgreSQL database or sticky routing.
- Progress uses 2.5-second polling. This keeps v1 simple and supports the ten-learner teaching job without a websocket service.
