# Independent verification 8 — PASS

**Candidate:** `b4abd34467f43e2436d9fe4dab70115ae1a6fc34`  
**Live URL:** https://lesson-code-room.sociobot.in  
**Verified:** 2026-08-29

## Verdict

**PASS.** No release-blocking defects were found. The live deployment identifies
itself as this exact candidate at `/health`, and its emitted JavaScript, CSS,
hero image, and checked self-hosted fonts had byte-for-byte SHA-256 matches
with the local production `dist/` output.

## First-read result

A cold Chromium visit made the product, audience, and first action clear in
plain words:

- What: “Run one coding exercise together.”
- For whom: “For remote teachers who need learners coding now, with clear
  progress and no student accounts.”
- First action: **Try it with sample data**; its adjacent text says that a
  sample room opens with three learners.

The action is one click and immediately rendered Moss Finch (Done), Blue
Comet (Ran code), and Quiet Fox (Joined). This passes the required first-read
and demo-sandbox gates.

## Claim tests

Fresh dependency install: `npm ci` (27 packages, 0 vulnerabilities). All
claims were run through the shipped demo entry point with:

```sh
npm test -- --grep '@claim:'
```

Result: **18 passed** (27.2 s), after the production Vite build and four Rust
tests. This executes every test expression recorded in
`.factory/claims.json`:

| Claim ID | Result |
| --- | --- |
| `anonymous-room` | PASS |
| `custom-room` | PASS |
| `sandbox-run` | PASS |
| `demo-reset` | PASS |
| `demo-storage-isolation` | PASS |
| `demo-sample-data` | PASS |
| `learner-reset` | PASS |
| `privacy-code` | PASS |
| `teacher-report-limits` | PASS |
| `product-scope` | PASS |
| `no-tracking` | PASS |
| `session-storage` | PASS |
| `offline-preview` | PASS |
| `rate-limit` | PASS |
| `free-capacity` | PASS |
| `room-retention` | PASS |
| `demo-retention` | PASS |
| `paid-checkout` | PASS |

## Local quality gates

- `npm test` — **PASS**: Vite production build, 4 Rust unit tests, and 36
  Playwright tests.
- `npx tsc -p frontend/tsconfig.json --noEmit` — **PASS**.
- `cargo fmt --check` — **PASS**.
- `cargo clippy --all-targets -- -D warnings` — **PASS**.
- `cargo build --locked --release` — **PASS**.
- `npm run build` — **PASS**, emitting `dist/`.
- Production payloads: JS 31.01 kB raw / 9.72 kB gzip; CSS 18.92 kB raw /
  4.95 kB gzip; self-hosted fonts total 71.35 kB. Initial JS is well below
  the 200 kB budget.

The environment has no Docker or Podman CLI, so the Dockerfile itself was not
locally built. The exact app production build above passed, and the deployed
container returned the candidate SHA from `/health`.

## Independent live exercise

- Teacher demo → learner join → edit HTML/JavaScript → Run → preview showed
  `QA preview` / `Works` → Mark as done; the teacher view showed `QA Swift —
  Done`. The persistent demo banner remained visible. No page or console
  errors occurred.
- Invalid and boundary API cases: blank and 25-character screen names returned
  `400 invalid_name` with the corrective 1–24-character message; invalid
  progress returned `400 invalid_status`; no teacher token returned
  `403 forbidden`. A seeded 10-capacity demo accepted seven additional joins
  and rejected the eighth with `409 room_full` and recovery guidance.
- Live demo response: `storage: "demo-blob"`, `DEMO-*` ID, `is_demo: true`,
  capacity 10, and observed TTL 7200 seconds. This confirms the production
  demo persistence boundary is separate from live-room storage.
- A simultaneous 48-request `POST /api/demo` burst produced **13 × 200** and
  **35 × 429**. Every sampled limited response had `Retry-After: 1`; a new
  request succeeded after two seconds. Observed allowance: 13 requests per
  client per one-second window.
- All discovered internal links returned 200; the hosted Sociobot checkout
  returned its expected 303 redirect.

## Privacy, headers, accessibility, and responsive checks

- Chromium request logging across landing, Privacy, Terms, demo, learner join,
  and Run recorded **no external HTTP(S) requests**. The preview creates a
  local `blob:` document only. Learner data stored only
  `sessionStorage[learner:DEMO-…]`; `localStorage` was empty.
- Response headers include CSP with `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, and `Permissions-Policy:
  camera=(), microphone=(), geolocation=()`. API responses are `no-store`;
  hashed JS is `public, max-age=31536000, immutable`. The sandbox response
  has its separate network-blocking CSP.
- `/opt/fleet/lib/verify-url.sh` passed the live landing page: 200, title,
  `lang=en`, one h1, main landmark, image alt checks, and no console errors
  (718 ms cold test load).
- Axe Playwright scans found zero serious/critical findings on `/`, `/demo`,
  `/privacy`, and `/terms`; the full local suite also scanned join/workbench
  and 404 states.
- At 390 px, `/`, `/demo`, `/privacy`, `/terms`, and the real 404 all had
  `scrollWidth === clientWidth === 390`. Keyboard Tab first focused the skip
  link with a visible `rgb(255, 200, 87) solid 3px` ring. With reduced motion,
  h1 transition and animation durations were `0.00001s`.

## Defects

None found.

No sign-in flow exists, which is appropriate for the brief’s anonymous
learner model; no alternate identity provider is present.
