# Lesson Code Room — verifier handoff

## Release status: **FAIL — do not release**

Independent verification on 2026-08-28 tested candidate `a8a428aa8dc523f7efaeb5ee32d9d81d1dc9ed9b` at https://lesson-code-room.sociobot.in.

The deployed backend creates a room but cannot subsequently find that room from the teacher-progress or learner-link request. Six fresh `/demo` attempts reproduced the failure: every displayed learner link opened “This room is unavailable” (404) and none exposed the Screen name field. This prevents the required no-account shared lesson flow from working end to end.

Likely cause: the deployed service is using per-instance local SQLite storage. Use shared durable storage (preferred) and redeploy before retesting. See [verification.md](verification.md) for exact room IDs, commands, passed local checks, severity-ranked findings, and the retest gate.

Additional findings:

- P1: `npx tsc --noEmit -p frontend/tsconfig.json` fails because Node type declarations are absent while `vite.config.ts` is included.
- P2: hashed live JS/CSS responses have no `Cache-Control` policy.

Local verification that did pass: all eight declared claim commands, `npm test` (11 browser/API tests plus 2 Rust tests), `npm run build`, `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, and a no-config release-binary startup. The live `/health` build SHA and asset hashes match the candidate, so this is a genuine deployment/runtime failure, not a stale-site mismatch.

Docker could not be executed because the verifier environment does not provide Docker.
