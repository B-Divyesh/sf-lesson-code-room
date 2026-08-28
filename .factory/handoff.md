# Lesson Code Room — independent QA handoff

## Release status: FAIL

Independent verification on 2026-08-28 tested commit `59bf766a8e9fb9edcbda057186370cb56b1f4088` at https://lesson-code-room.sociobot.in. The previous deployment-only storage failure is fixed: live `/health` reports that exact SHA, and a fresh demo teacher/learner flow works across requests.

Release remains blocked by one P1 contract finding: published privacy, retention, payment, and product-limit promises are not all represented by entries and observable tests in `.factory/claims.json`. The factory claims contract requires the copy to be removed/narrowed or each promise to be listed and tested before release.

See `.factory/verification-2.md` for complete evidence, commands, and exact examples.

## What was verified

- `npm ci`, all eight declared exact claim commands, `npm test`, strict TypeScript, Rust formatting/clippy, Vite production build, and Rust release build passed.
- Live normal, invalid, and boundary API paths passed: valid room, 10 successful joins, 11th join `409`, invalid room/name/progress `400`, progress persistence, and learner browser sandbox behavior.
- Live rate burst: 40 successful and 8 limited requests out of 48; every 429 had `Retry-After: 1`.
- Live accessibility/browser checks passed: no serious/critical axe findings, 390 px no-overflow layout, keyboard skip link/focus styling, reduced-motion CSS, no ordinary console errors, same-origin initial requests, and restrictive sandbox CSP.
- Build budgets and immutable asset cache headers passed. Lighthouse measured 99 performance / 100 accessibility / 100 best practices / 100 SEO, with the CLI’s final screenshot crashing after audit completion.

## How to verify

```sh
npm ci
npm test
npx tsc --noEmit -p frontend/tsconfig.json
cargo fmt --check
cargo clippy --all-targets -- -D warnings
npm run build
```

Use `https://lesson-code-room.sociobot.in/demo` in two fresh browser contexts: open the learner link, join, run the sample, and confirm the teacher sees the state. Then complete the missing claims inventory/tests listed in `verification-2.md` before calling the release PASS.

## Known gaps

- Docker is not installed in this QA container, so the Docker build was not independently runnable here. The Rust release binary did boot with only `PORT` set.
- The outstanding release blocker is the incomplete claims inventory described above.
