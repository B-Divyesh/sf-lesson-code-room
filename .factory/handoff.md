# Lesson Code Room handoff

Date: 2026-09-06

Work order: `lesson-code-room-repair-6`

Live URL: <https://lesson-code-room.sociobot.in>

Implementation deployed: `8cfa5ff067bf28426a8e12c3185a52af5360f056`

## Result

**PASS.** The P1 storage finding is resolved. Live room state now uses SQLite on the product's durable `/data` mount, not Azure Blob storage. Demo rooms remain process-memory-only and are isolated from live room state.

## What changed

- Removed the Blob and managed-identity storage paths from the backend. Live room, participant, progress, retention, and teacher-token operations now use `SqlitePool` only.
- Default live storage is `/data/lesson-code-room-v2.db`; if `/data` is absent in local development, it falls back to `data/lesson-code-room-v2.db`. `DATABASE_URL` remains an optional SQLite override for isolated tests.
- Configured SQLite for the Azure Files mount with the `unix-dotfile` VFS, rollback journal, a 15-second busy timeout, serialized pool access, and migration retry. The dot-file VFS avoids unsupported POSIX byte locks and coordinates the short managed-restart overlap.
- Kept the existing product deployment bounded to one configured replica (`minReplicas: 1`, `maxReplicas: 1`) and mounted `sf-lesson-code-room-data` at `/data`.
- Replaced the former source-string demo-storage regression check with an outcome test: it creates a live room, uses a demo room, and proves the demo activity does not change the live room.
- Updated the README and demo documentation to describe the actual SQLite storage and memory-only demo behavior.

## Live verification

- Revision `sf-lesson-code-room--0000030` started healthy with build SHA `8cfa5ff`, `storage_config: SQLite /data mount`, and `demo_storage: memory`.
- Created a live room, joined a learner, recorded progress, restarted the revision, and read the same room back successfully. The new replica also started successfully during the managed restart handoff.
- Created a demo room through HTTPS; it reported `storage: memory`. The fresh desktop flow showed Moss Finch, Blue Comet, and Quiet Fox, retained “Demo — sample data, nothing is saved”, and retained that label after Reset demo. The previously created live room remained available after demo use.
- Sent 52 live API requests from one client identity: 39 were limited with HTTP 429 and `Retry-After`.
- Fresh 1440 × 900 desktop and iPhone 13 contexts both showed, before scrolling: “Run one coding exercise together”; the remote-teacher audience; and “Try it with sample data”. No console errors were observed.
- `/`, `/demo`, `/privacy`, and `/terms` returned their own titles and headings. The deliberate `/not-a-real-room` 404 rendered the designed Not found page. `robots.txt` and `sitemap.xml` returned successfully.
- `verify-url.sh` passed: HTTPS 200, title, `lang`, one `<h1>`, `<main>`, image alternatives, and no console errors. Live Playwright Axe found 0 violations. Lighthouse mobile: performance 99, accessibility 100, best practices 100, SEO 100.

## Local and clean-checkout verification

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo fmt --all -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo build --locked --release
npm run build
```

All commands pass on the final implementation. `npm test` passed 6 Rust tests and 36 Playwright tests. All 18 commands declared in `.factory/claims.json` also passed individually from a fresh checkout of `8cfa5ff`.

## Billing and catalog evidence

- The free core remains available without billing.
- Room Plus remains the advertised $29 one-time license for 30-learner rooms. Public offer metadata was written to `/work/.evidence/billing-offer.json`; the catalog description was copied to `/work/.evidence/catalog-description.txt`.
- A live paid entitlement was not issued during this repair. Hosted checkout and the recorded verification fixture are covered by the declared claim; live entitlement remains dependent on the factory billing-registration operator.

## Known limits

- The earlier locked `/data/lesson-code-room.db` file is left untouched. New rooms use the separate durable `lesson-code-room-v2.db` SQLite file on the same mount. The former Blob-backed state is not read or migrated.
- Rooms retain the documented short lifetime: live rooms 24 hours and demos two hours.
