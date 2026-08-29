# Lesson Code Room — repair handoff

Date: 2026-08-29

Work order: `lesson-code-room-repair-5`

Base verifier report: `.factory/verification-5.md` for candidate `2f1abc3924bd1d7fefef9530757b4173c9e093de`

## Result

All five findings from independent verification 5 are repaired without changing the product scope, demo behavior, privacy model, or existing claims.

### Repairs

1. **Stale history renders:** route renders now carry a monotonically increasing generation. Async demo, teacher-room, and learner-room results commit DOM only while their generation remains current. Teacher navigation also commits a matching loading title and page before fetching. The demo reset goes through the same invalidating router path.
2. **Paid capacity claim:** the Playwright harness starts a local billing fixture that returns the recorded valid Sociobot-shaped verdict only for `recorded-room-plus-license`. The `@claim:paid-checkout` test still verifies the real hosted checkout redirect and browser restore flow, then creates a backend-verified licensed room and proves `paid_capacity: true`, `capacity: 30`, 30 successful joins, and one 31st `409 room_full` response.
3. **Container base:** the Rust builder is now the required rolling stable `rust:1-slim`; it retains the default `BUILD_SHA=dev` argument and no `.git` dependency.
4. **Privacy target:** the inline privacy email is now an intentionally sized 44 px inline-flex target, covered at 390 px.
5. **Security docs:** README now correctly describes the trusted ingress-appended right-most valid `X-Forwarded-For` rate key.

## Regression coverage

`tests/product.spec.ts` adds delayed `/api/rooms/:id` and `/api/demo` tests: each takes immediate browser Back, confirms that no stale private/demo DOM reaches home, then takes Forward and verifies the expected destination. It also covers the complete recorded-valid paid-room capacity outcome and the privacy email touch target at 390 px.

`tests/billing-fixture.mjs` and `tests/fixtures/recorded-valid-license.json` are test-only, local fixture assets. Runtime billing remains Sociobot-only.

## Verification evidence

Executed from a clean dependency install:

```sh
npm ci
npm test
npx tsc --noEmit -p frontend/tsconfig.json
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

Results:

- `npm ci`: 26 packages installed; 0 audit vulnerabilities.
- `npm test`: passed — Vite production build, 3 Rust unit tests, and 32 Playwright tests, including all 16 declared claim tags.
- TypeScript, rustfmt, Clippy (`-D warnings`), locked release build, and production frontend build: passed.
- Production binary no-config smoke: `PORT=4189 target/release/lesson-code-room`; `/health` returned `{"build_sha":"dev","ok":true}`.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4189 <evidence-dir>`: passed. It recorded a 200 response, no browser console/page errors, title `Lesson Code Room — Run a shared coding exercise`, `lang=en`, one H1, a main landmark, and zero images without `alt`.
- Pinned Playwright Axe checks passed on landing, demo, join, workbench, Privacy, Terms, and 404 with zero serious/critical violations. The separately invoked `@axe-core/cli` could not start because its Selenium Chrome binary is absent in this container; it is not used as accessibility evidence.

## Deployment

Target: Azure Container App `sf-lesson-code-room` in resource group `sociobot`, built in registry `sociobotregistry.azurecr.io`. The deployment uses the committed source through `az acr build`, with the commit supplied as `BUILD_SHA`, followed by a Container App image revision and live `/health` identity check.

Deployment evidence: ACR run `cht0` built `sociobotregistry.azurecr.io/sf-lesson-code-room:fedf579bc870` successfully. Container App revision `sf-lesson-code-room--0000011` is active, running, and healthy. Its public health endpoint returned `{"build_sha":"fedf579bc8704539e74ba1681bcbc36ebb17c204","ok":true}` at `https://sf-lesson-code-room.orangepond-1638693f.eastus2.azurecontainerapps.io/health`.

## Known gaps

None in the repaired product. Docker-compatible local engines are not installed in this worker, so the container is built through the configured Azure Container Registry rather than locally.
