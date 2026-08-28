# Lesson Code Room — repair 4 handoff

Date: 2026-08-28  
Base verified: `8100b1e95bf2c3cb929832e74878f8fdd5fa3069`

## Repaired

- Registered the live $29 Room Plus product with Sociobot billing; its hosted checkout now returns HTTP 303.
- Demo reset now cancels the previous room poll; demo identity, reset, and exit controls persist on demo join and workbench views.
- Progress is monotonic: Done cannot revert to Ran code in SQLite or shared Blob storage.
- The limiter uses the ingress-appended rightmost forwarded address, expires old windows, and caps key storage. API responses are `Cache-Control: no-store`; only hashed assets are immutable.
- Fixed the 404 contrast, 390 px touch targets, paid merchant/refund terms, and learner-visible sandbox runtime errors.

## Verification

- Clean install: `npm ci` — passed (26 packages, 0 vulnerabilities).
- `npm test` — passed: 3 Rust tests and 30 Playwright tests, including all 16 declared claims and new regressions for every verifier finding.
- The paid checkout claim follows the real Sociobot checkout endpoint and asserts its redirect.
- `npm run build` — passed; JS 28.59 KB raw / 9.32 KB gzip, CSS 17.74 KB raw / 4.73 KB gzip.
- `npx tsc --noEmit -p frontend/tsconfig.json`, `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features -- -D warnings`, and `cargo build --locked --release` passed before the final frontend-only regression adjustment; `npm test` passed after it.
- Playwright covers desktop, 390 px mobile, keyboard tabs, offline preview/update recovery, privacy request scope, 404 axe, and sandbox error recovery. No serious or critical axe findings remain.

## Run

```sh
npm ci
npm test
PORT=8080 cargo run
```

The container still starts with only `PORT`; managed identity selects shared Blob storage in Azure and local SQLite remains the no-config developer fallback.

## Remaining

No known release blockers. Docker/Lighthouse were not rerun locally in this repair container; the production build, browser/a11y suite, and release binary checks are recorded above. Deployment identity and live smoke evidence are appended after deployment.
