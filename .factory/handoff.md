# Lesson Code Room — polish 3 handoff

Date: 2026-08-29
Work order: `lesson-code-room-polish-3`
Deployed repair: `e3a570da5ef9f784583f06ab81533892095f6767`
Live URL: <https://lesson-code-room.sociobot.in>

## Result

All findings from reviews 1–3 are resolved. The last open finding, F-3-1, now uses the direct 404 heading `Page not found`, keeps a clear recovery sentence, and has an exact browser regression test.

The earlier first-screen, demo isolation, claims, metadata, routing, focus, legal, responsive, privacy, billing, and backend fixes remain intact. A cache-header edge case found during the final gate was also repaired: Vite hashes that contain `-` now receive immutable caching without misclassifying stable artwork. The 200% visual review also found and fixed crowded footer links; the test now rejects overlaps, not only horizontal scroll.

## Verification

Final clean clone `/tmp/lesson-code-room-polish-3-final-TapIET` at `e3a570d`:

- `npm ci`: 26 packages, 0 vulnerabilities.
- All 18 claim tests passed together. Each exact inventory command also passed individually in the earlier clean clone `/tmp/lesson-code-room-polish-3-Gk4Us4`.
- `npm test`: build passed; 4/4 Rust tests and 37/37 Playwright tests passed.
- `npx tsc -p frontend/tsconfig.json --noEmit`: passed.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- Build payload: JS 31.00 KB raw / 9.72 KB gzip; CSS 18.97 KB / 4.96 KB gzip; fonts 71.35 KB.

Production evidence after deployment:

- `/health` returned `ok: true` and build SHA `e3a570da5ef9f784583f06ab81533892095f6767`.
- `/opt/fleet/lib/verify-url.sh` passed with title, `lang=en`, one H1, main landmark, image alt text, and zero console errors.
- Fresh 390 px and 1440 px Chromium contexts passed the landing, immediate demo, reset, route metadata, legal links, focus, 404, privacy-request, and 200% text checks.
- Axe found 0 serious or critical findings on `/`, `/?demo=1`, `/privacy`, `/terms`, and the real HTTP 404.
- Demo API returned `storage: demo-blob` and a `DEMO-*` room. Reset changed the room link.
- The demo-flow request log contained only `https://lesson-code-room.sociobot.in`.
- All public routes, robots, sitemap, sandbox, and health returned their expected status; the unknown route returned 404.
- A 60-request API burst returned 39×200 and 21×429. Every 429 included `Retry-After: 1`.
- A 100-request `/health` smoke completed with 100 successes in 99 ms (observed 1,010 requests/second).
- Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100, FCP 1.50 s, LCP 1.65 s, TBT 37 ms, CLS 0.0033.

Evidence is under `.factory/evidence/polish-3/`. The main artifacts are:

- `live-audit.json` and `live-http-audit.json`
- `live-landing-mobile.png` and `live-landing-desktop.png`
- `live-demo-immediate-mobile.png`
- `live-404-mobile.png` and `live-404-desktop.png`
- `verify-url/verify.json`
- `lighthouse.json`

## Run and verify

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
```

Run the retained live audit after deployment:

```sh
node .factory/evidence/polish-3/live-audit.cjs
node .factory/evidence/polish-3/live-http-audit.mjs
```

## Known gaps

None.
