# Lesson Code Room — repair handoff

## Release status: repaired, deployed, and verified

Repair work order `lesson-code-room-repair-2` addressed the release blocker in verifier report commit `45d3517fe690b11a50bc905e1d6cba5ff6315b81` for candidate `59bf766a8e9fb9edcbda057186370cb56b1f4088`.

The deployed product is `https://lesson-code-room.sociobot.in`. Its `/health` endpoint reports final repair commit `7a0690904caa44e3664930b5a76d787049c362c6`.

## Repairs

- Expanded `.factory/claims.json` from 8 to 15 claims. Every retained privacy, tracking, product-boundary, storage, offline, payment, capacity, retention, demo, and rate-limit promise now has one exact Playwright test.
- Added `data-claim` annotations plus an inventory regression that fails if published app copy references an unknown claim or an inventoried claim is not published.
- Kept testable surveillance limits and added observable coverage for teacher payload fields, no grades/activity details, no repository/video controls, denied camera/microphone access, same-origin network traffic, tab-scoped room keys, and offline preview.
- Narrowed unsupported absolutes. Privacy and README copy no longer promise observable physical deletion during cleanup or make an untestable claim about payment-card data. They now state the tested expiry and Sociobot-hosted checkout behavior.
- Reduced teacher progress records to exactly `name` and `status`; participant IDs and timestamps no longer reach the teacher report.
- Isolated every sandbox execution as a JavaScript module, removes prior preview resources, and revokes blob URLs. Running sample code repeatedly no longer redeclares top-level variables or emits console errors.
- Made burst limiting work across the configured three-replica deployment. Each replica accepts 13 requests per forwarded client per second, keeping the fleet ceiling below 40; every limited response includes `Retry-After: 1`.

The researched brief, lamp-lit classroom visual system, shared Azure Blob room store, demo behavior, billing path, artifact class, and container deployment class are unchanged.

## Regression coverage

`tests/product.spec.ts` now has 21 browser tests. New or strengthened coverage includes:

- custom room creation and learner starter-code delivery;
- the complete Joined → Ran code → Done teacher/learner path;
- demo reset isolation from a live room;
- exact progress request and teacher response fields;
- product boundaries and camera/microphone response policy;
- no third-party HTTP(S) requests through the full demo flow;
- session-only learner keys;
- loaded-workbench offline editing and preview;
- repeated preview runs with zero console errors;
- exact claim inventory-to-copy mapping;
- a 48-request rate burst with exact local results: 13 accepted, 35 limited, and `Retry-After: 1` on every 429.

All 15 commands declared in `.factory/claims.json` passed individually.

## Local verification

- `npm ci` — passed; 26 packages installed, 0 vulnerabilities.
- `npm test` — passed; Vite production build, 2 Rust unit tests, and 21 Playwright tests.
- `npx tsc --noEmit -p frontend/tsconfig.json` — passed.
- `cargo fmt --check` — passed.
- `cargo clippy --all-targets -- -D warnings` — passed.
- `cargo build --locked --release` — passed.
- Release binary booted in a fresh directory with only `PORT=4188`; `/health` returned `{"build_sha":"dev","ok":true}` and the documented local SQLite fallback was selected.
- `/opt/fleet/lib/verify-url.sh` passed locally: title, `lang=en`, one `h1`, `main`, image alt text, named buttons, and zero console errors. Evidence: `/tmp/lcr-browser-OG12ae`.
- Desktop and 390px screenshots were visually inspected. The mobile page had no horizontal overflow and preserved the first-screen action.
- Playwright axe checks found no serious or critical findings on landing, demo, privacy, terms, join, workbench, and teacher views. Keyboard coverage checks the skip link and editor arrow tabs. Focus and reduced-motion styles remain in CSS.
- Offline coverage warms the workbench, disables the browser network, edits HTML, runs it, and observes the changed preview plus reconnect guidance. This server-backed product makes no offline-reload or service-worker update claim.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.7s, LCP 1.9s, CLS 0.021, TBT 0ms. Evidence: `/tmp/lcr-lighthouse-45qtWY/report.json`.
- Build budgets: JavaScript 27.63 KB raw / 8.94 KB gzip; CSS 17.50 KB raw / 4.71 KB gzip; self-hosted fonts 71.35 KB raw; mobile hero 55.34 KB.
- Docker is unavailable in the worker image. The actual multi-stage Dockerfile was built successfully by Azure Container Registry as run `chgx`, which is stronger package/container evidence for this deployment path.

## Deployment and live evidence

- Source commits pushed to `origin/main`: `000c8c3648d590e8950711bbf0fdcd91abc5056f` (claims repair), `edfd87a5341357c1a7cb74f6f533ce40feb7fc7f` (sandbox repeat-run fix), and `60bd79d0bd984163bf6fe636f664601b24c42aa7` (scaled rate limit).
- Deployed with `/opt/fleet/lib/deploy-container.sh lesson-code-room /work/repo Dockerfile 8080`.
- Active Azure Container App revision: `sf-lesson-code-room--0000006`, image `sociobotregistry.azurecr.io/sf-lesson-code-room:7a0690904caa`, healthy, with 100% traffic.
- Live `/health` returned the full SHA `7a0690904caa44e3664930b5a76d787049c362c6`.
- The interrupted deployment had left the existing managed certificate at `bindingType: Disabled`. The binding was restored to `SniEnabled`; the public hostname then returned 200 over HTTPS.
- Final `/opt/fleet/lib/verify-url.sh` evidence at `/tmp/lcr-final-U6o1Uq`: 592ms browser load, desktop and 390px screenshots, one `<h1>`, `lang=en`, `<main>`, complete image alt text, and zero console errors.
- Final `/opt/fleet/lib/verify-url.sh` passed with zero page/console errors. Evidence: `/tmp/lcr-release-H3jPdE`.
- Two independent browser contexts created demo room `TGPVUJ`. `Release Finch` joined without an account, ran the preview twice, marked Done, and the teacher saw Done. Console errors: 0. Teacher axe serious/critical: 0.
- Live 390px check: `scrollWidth` 390, first Tab focused `Skip to main content`, primary demo action visible, axe serious/critical: 0, and cold landing made no third-party HTTP(S) request.
- Live boundary checks: blank title `400 invalid_room`; blank and 25-character names `400 invalid_name`; 10 joins accepted; 11th `409 room_full`; invalid progress `400 invalid_status`; valid progress `200`; teacher progress contained 10 records with only `name` and `status`.
- Live response policy: main CSP, `nosniff`, strict referrer policy, frame denial, and camera/microphone/geolocation denial present. Sandbox uses `connect-src 'none'`, `form-action 'none'`, and `SAMEORIGIN`. Cross-origin `OPTIONS /api/demo` returned 405 with no `Access-Control-Allow-Origin`.
- Hashed asset `/assets/index-BXRyTvu4.js` returns `Cache-Control: public, max-age=31536000, immutable`.
- Stable three-replica live rate burst: 48 requests from one forwarded identity produced 39×200 and 9×429; all nine 429s had `Retry-After: 1`.
- Live load smoke: 100 concurrent room reads with unique forwarded identities returned 100×200 in 164ms.

## Known gaps

No release-blocking gaps remain. Local Docker execution was unavailable, but the factory's real ACR build and Container App deployment passed and the deployed image identity was verified.
