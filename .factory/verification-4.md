# Independent verification 4 — FAIL

Date: 2026-08-28  
Candidate: `8100b1e95bf2c3cb929832e74878f8fdd5fa3069`  
URL assessed: https://lesson-code-room.sociobot.in

## Verdict

**FAIL — do not release candidate `8100b1e…`.** No product source was changed.

The candidate passes its declared tests and build gates, but fails two independent mandatory product checks from a clean checkout. During this QA run the live URL also changed from the requested candidate to `2f1abc3924bd1d7fefef9530757b4173c9e093de`, so later live behavior is not valid evidence for the candidate.

## P1 release blockers

1. Demo treatment is not persistent. On a local server built from the exact candidate, opening `/demo` and then its learner link at 390 px produced `{"banner":0,"reset":0,"startReal":0}`. The required **Demo — sample data, nothing is saved**, **Reset demo**, and **Start for real** controls disappear on learner join/workbench views. Candidate `renderJoin` and `renderWorkbench` do not pass `demoBanner()` to `shell()`.

2. The candidate 404 has a serious axe failure. `/not-a-page` correctly returned a 404, but axe 4.10.2 reported `color-contrast` with serious impact targeting `.door-number`. Candidate CSS uses `#273a42` against `#0b1318`.

3. Deployment drift. Earlier in this run `/health` returned the requested `8100b1e…` SHA and local/live HTML, JS, and CSS SHA-256 digests matched. Later `/health` returned `2f1abc3924bd1d7fefef9530757b4173c9e093de`; the landing asset changed from `index-DwTNYr1c.js` to `index-zPOtIOnd.js`, and the old asset URL served different bytes.

## Fresh passing evidence

- First-read gate: pass. The cold candidate page plainly says it runs one coding exercise together, names remote teachers, and gives **Try it with sample data** with its immediate result.
- Claims: all 16 exact `.factory/claims.json` commands passed independently after installing dependencies in a clean checkout: `anonymous-room`, `custom-room`, `sandbox-run`, `demo-reset`, `learner-reset`, `privacy-code`, `teacher-report-limits`, `product-scope`, `no-tracking`, `session-storage`, `offline-preview`, `rate-limit`, `free-capacity`, `room-retention`, `demo-retention`, and `paid-checkout`.
- `npm test`: pass — Vite build, 2 Rust tests, 22/22 Playwright tests.
- `npx tsc --noEmit -p frontend/tsconfig.json`, `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, and `cargo build --locked --release`: pass. No separate lint script exists.
- No-config binary smoke: with only `PATH` and `PORT=4188`, `/health` returned `{"build_sha":"dev","ok":true}` and structured logs identified the local SQLite fallback.
- Candidate mobile normal flow: at 390 px and reduced motion, sample open, anonymous join, run, and sandbox interaction passed with scroll width 390, no console/page errors, and no cross-origin product requests. Keyboard Tab showed a 3 px amber skip-link outline; code tabs support arrow keys.
- Axe serious/critical findings were zero on landing, demo, privacy, and terms. `verify-url.sh` passed the candidate landing page.
- Candidate fixed-identity 48-request `POST /api/demo` burst: 13 × 200, 35 × 429, every limited response `Retry-After: 1`. Empty room titles and 25-character learner names returned helpful 400 errors. Twenty concurrent room reads returned 20 × 200 in 143 ms.
- Candidate bundle budgets: 27.65 KB JS raw / 8.95 KB gzip; 17.50 KB CSS raw / 4.71 KB gzip; fonts 71.35 KB raw; mobile hero 22.32 KB.

PWA, library/CLI, and sign-in checks do not apply to this hosted no-sign-in product. Docker could not be built because this verifier image has no Docker-compatible engine; release builds and runtime were verified directly.

## Retest gate

Render the demo treatment on all demo learner views, fix the 404 contrast, add regression coverage for both, rerun every declared claim and quality gate, then deploy and keep only the approved SHA active while rechecking `/health`, asset digests, demo learner pages, and the 404 axe result.
