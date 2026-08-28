# Lesson Code Room — repair handoff

## Release status: deployed and verified

This repair addresses every finding in the independent report for candidate `a8a428aa8dc523f7efaeb5ee32d9d81d1dc9ed9b`.

## Repairs

- **P0 shared rooms:** production containers now select a dedicated Azure Blob room store through the factory-managed identity. The Docker image no longer sets `DATABASE_URL` to replica-local SQLite. Room records and participant records are shared across replicas; participant joins use a short Azure Blob lease so the 10-learner capacity remains atomic. Explicit `DATABASE_URL` values retain SQLite for local development and isolated tests.
- **P1 TypeScript:** added the pinned `@types/node` development dependency, so the included Vite config type-checks cleanly.
- **P2 asset caching:** the Axum response policy and static-host config both apply `Cache-Control: public, max-age=31536000, immutable` to hashed `/assets/` responses.

## Regression coverage

`tests/product.spec.ts` now prevents the container from regressing to an injected local SQLite URL and asserts the observable immutable-cache response header. The existing anonymous-room claim remains the full desktop learner → teacher browser flow.

## Verification completed before deployment

- Clean dependency install: `npm ci` — pass (0 audited vulnerabilities).
- Full suite: `npm test` — pass (13 Playwright tests, 2 Rust unit tests, production frontend build).
- Each of the eight exact declared claim commands — pass.
- Strict TypeScript: `npx tsc --noEmit -p frontend/tsconfig.json` — pass.
- Rust quality: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test`, and `cargo build --release` — pass.
- Release binary with no database configuration: `/health` returned `{"build_sha":"dev","ok":true}` and logged shared managed-identity storage.
- Shared-store integration: two independent local server processes, each with its managed identity and no `DATABASE_URL`, shared a demo room. Replica A created `GFUETP`; replica B fetched it, joined `Replica Finch`, and marked it Done; replica A observed `{ "joined": 1, "ran": 1, "done": 2 }`.
- Response policy: local `HEAD /assets/index-*.js` returned `Cache-Control: public, max-age=31536000, immutable`.
- Browser desktop and 390px mobile, keyboard tab/arrow controls, privacy/sandbox request blocking, rate limiting, and axe serious/critical checks are covered by the passing Playwright suite. No third-party browser resources are used on the landing flow.

Docker is not installed in this worker image, so the container build is verified by the factory ACR deployment step.

## Deployment verification

Deployed product revision: `a17b63ff3c3523bb7fbdbcfefa7e618ddfeac1b0` at `https://lesson-code-room.sociobot.in`.

- `GET /health` returned the deployed revision SHA and `{ "ok": true }`.
- In two fresh Playwright browser contexts, `/demo` created room `QLAYQM`; its learner link opened successfully, `Live Replica Finch` joined and ran the sample, and the independent teacher context observed that learner's progress. This is the production reproduction of the former P0 path.
- The factory verifier URL check on the live container endpoint found a 200 response, no console errors, `lang="en"`, one title, one `h1`, a `main` landmark, and no missing image alt text or unnamed buttons.
- Live 390px browser check: `scrollWidth` was exactly 390; the first Tab focused **Skip to main content**; axe reported no serious or critical violations.
- Live `HEAD /assets/index-BBeU5N0A.js` returned `Cache-Control: public, max-age=31536000, immutable` plus the expected CSP, nosniff, and referrer headers.
- Live 48-request `POST /api/demo` burst with one forwarded IP returned 40×200 and 8×429; every 429 included `Retry-After: 1`.

No known release-blocking gaps remain. Docker itself is unavailable in the worker, but ACR built the deployed image successfully.
