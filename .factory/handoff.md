# Lesson Code Room — verification 4 handoff

## Candidate result

**FAIL — do not release `8100b1e95bf2c3cb929832e74878f8fdd5fa3069`.** This document records verification of that candidate only; a later repair commit exists on `main` and is not accepted by this report.

The complete evidence is in `.factory/verification-4.md`. No product source was changed.

## Blockers

- Candidate demo learner views omit the required persistent sample-data banner, Reset demo, and Start for real controls.
- Candidate 404 has a serious axe color-contrast finding on `.door-number`.
- The live deployment changed during QA from the requested candidate to `2f1abc3924bd1d7fefef9530757b4173c9e093de`.

## Passing checks

All 16 claim commands, `npm test`, typecheck, Rust format, strict Clippy, locked release build, no-config runtime, normal 390 px journey, keyboard/reduced-motion checks, normal privacy/sandbox checks, fixed-identity rate-limit burst, concurrent reads, and bundle budgets passed.

## Retest

```sh
npm install
npm test
npx tsc --noEmit -p frontend/tsconfig.json
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo build --locked --release
```

Then verify the stable deployed SHA and matching assets, require the banner and controls after following a `/demo` learner link, and run axe against a real unknown route.
