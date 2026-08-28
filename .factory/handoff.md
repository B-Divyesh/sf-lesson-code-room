# Lesson Code Room — repair handoff

## Release status

Ready for independent verification. Repair work order `lesson-code-room-repair-3` addresses the only release blocker in verifier report commit `7a506be4ccbd038c0f1e0cf37a6e36851b1aa595` for candidate `5dd8f3ebf3259231829a767f508ad6273135b1a9`.

The original `web-with-backend` artifact, Rust/axum plus SQLite-or-Azure-Blob architecture, container deployment, researched brief, visual system, demo, billing path, and all previously passing behavior remain unchanged.

## Finding repaired

The README promises that a learner can reset an exercise, and the workbench provides **Reset starter code**. That behavior worked, but it was absent from `.factory/claims.json` and had no tagged observable test. The old `demo-reset` claim covers replacing a sample room, not restoring a learner's files.

- Added the distinct `learner-reset` claim and its exact command: `npm test -- --grep @claim:learner-reset`.
- Attached `data-claim="learner-reset"` to the published workbench action so inventory-to-copy checking includes it.
- Added a browser regression that enters through `/demo`, joins as a learner, edits HTML, CSS, and JavaScript through the visible tabs, and proves the changed markup, script, and CSS rendered.
- The test accepts the exact destructive confirmation from the keyboard at a 390×844 viewport. It then asserts all three fields equal their original starter values, the status says `Starter code restored`, the original heading and background return, and the original button script runs.
- Updated `.factory/demo.md` so the verifier path distinguishes learner starter reset from demo-room reset.

## Local verification evidence

- `npm ci` — passed; 26 packages installed, 0 vulnerabilities. Playwright remains pinned to `1.58.2`.
- Every command in `.factory/claims.json` — 16/16 passed independently from the demo entry point.
- `npm test` — passed: Vite production build, 2 Rust unit tests, and 22 Playwright integration/browser tests.
- `npx tsc --noEmit -p frontend/tsconfig.json` — passed.
- `cargo fmt --check` — passed.
- `cargo clippy --all-targets -- -D warnings` — passed.
- `cargo build --locked --release` — passed.
- The release binary started in a fresh temporary directory with no configuration except `PORT=4188`. `/health` returned `{"build_sha":"dev","ok":true}` and startup logged `local SQLite fallback (no managed identity)`.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4188 /tmp/lcr-repair-browser` — passed in 614 ms with the descriptive title, `lang=en`, one `h1`, `main`, complete image alt text, named buttons, and zero console errors. Desktop and 390px screenshots were inspected.
- Browser acceptance — desktop first Tab focused the 44px skip link with a 3px solid focus outline. The 390px learner workbench had `scrollWidth=390`, zero console/page errors, and no serious or critical axe findings. The landing page also had no serious or critical axe findings.
- Reduced motion — at 390px with `reducedMotion: reduce`, control transition duration was `0.00001s` and no animation loops remained.
- Privacy/offline/response policy — the suite proves no cross-origin page requests in the complete demo flow, learner edits absent from progress writes, tab-only learner tokens, camera/microphone denial, sandbox `connect-src 'none'`, and loaded-workbench editing/preview while offline. This server-backed product makes no offline-reload or service-worker update claim.
- HTTP checks — `/`, `/sandbox.html`, and `/health` returned 200; an unknown route returned 404; hostile-origin `OPTIONS /api/demo` returned 405 without CORS access. Main responses had CSP, `nosniff`, strict referrer policy, frame denial, and permissions policy. The sandbox had its stricter CSP and `SAMEORIGIN` frame policy.
- Rate/load — the claim test sent 48 simultaneous requests and observed 13×200 plus 35×429, with `Retry-After: 1` on every 429. A separate load smoke sent 100 concurrent room reads from distinct forwarded clients: 100×200 in 227 ms.
- Lighthouse mobile — Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4s, LCP 1.7s, CLS 0.018, TBT 80ms.
- Production assets — JavaScript 27.65 KB raw / 8.95 KB gzip; CSS 17.50 KB raw / 4.71 KB gzip; fonts 71.35 KB raw; mobile hero 22.32 KB. All budgets pass.
- Package/consumer testing does not apply to this hosted product. Docker is unavailable locally; the required Azure Container Registry build is the container/package verification path below.

Evidence files: `/tmp/lcr-repair-browser/verify.json`, desktop/mobile landing screenshots, mobile workbench screenshot, Lighthouse JSON, and `/tmp/lcr-claim-*.log`.

## Deployment and live verification

The final committed `main` revision is pushed to `origin` and deployed with:

```sh
/opt/fleet/lib/deploy-container.sh lesson-code-room /work/repo Dockerfile 8080
```

The factory ACR build supplies the exact source commit through `BUILD_SHA`, starts the image as a non-root user with only `PORT`, and verifies HTTPS at `https://lesson-code-room.sociobot.in`. Final acceptance checks compare live `/health` with `git rev-parse HEAD`, repeat the learner reset flow from `/demo`, inspect the live hashed asset policy, response headers, 390px layout, keyboard focus, axe results, console, privacy requests, and a 100-request shared-room smoke.

## Known gaps

No known release-blocking gaps. There is intentionally no service worker or offline-reload promise; only an already loaded learner workbench continues editing and previewing offline.
