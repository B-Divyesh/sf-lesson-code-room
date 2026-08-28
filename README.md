# Lesson Code Room

Run one shared HTML, CSS, and JavaScript exercise during a live remote lesson. Teachers create a short-lived room, share one learner link, and see only three progress states: Joined, Ran code, and Done.

The product is for teachers and tutors who need learners coding without account setup. It is not an LMS, grader, repository, proctoring tool, or video service.

Live site: <https://lesson-code-room.sociobot.in>

Try the isolated sample room: <https://lesson-code-room.sociobot.in/demo>

## What works in v1

- Create one exercise with starter HTML, CSS, and JavaScript.
- Share a room link with up to 10 learners for free.
- Let each learner edit, run, reset, and mark the exercise done.
- See anonymous screen names move through three progress states.
- Run learner code in a sandbox that blocks network requests.
- Expire live rooms after 24 hours and demo rooms after two hours.
- Open temporary sample data through `/demo` without changing live rooms.
- Restore a Room Plus license through Sociobot billing. Room Plus costs $29 once and raises new rooms to 30 learners.

## Run locally

Requirements: Node.js 22+, npm, Rust 1.89+, and a Chromium browser for Playwright.

```sh
npm install
npm run build
PORT=8080 cargo run
```

Open <http://localhost:8080>. Outside Azure, the server creates `data/lesson-code-room.db`. Supplying `DATABASE_URL` also selects SQLite, which is useful for isolated local tests.

For split frontend development:

```sh
PORT=8080 cargo run
npm run dev
```

Vite runs on <http://localhost:5173> and proxies `/api` to the Rust server.

## Test

```sh
npm test
```

This exact command builds `dist/`, runs Rust unit tests, starts the production server on port 4174, and runs Playwright claim and accessibility tests. Playwright is pinned to 1.58.2.

Run one documented claim:

```sh
npm test -- --grep @claim:sandbox-run
```

The claims and their sandbox evidence are listed in [`.factory/claims.json`](.factory/claims.json). Demo behavior is documented in [`.factory/demo.md`](.factory/demo.md).

## Container

```sh
docker build --build-arg BUILD_SHA="$(git rev-parse --short HEAD)" -t lesson-code-room .
docker run --rm -p 8080:8080 lesson-code-room
curl http://localhost:8080/health
```

The image runs as a non-root user, listens on `PORT` (default `8080`), and serves the built frontend from the same process. In the factory container environment it uses its managed identity to store room records in the dedicated shared Azure Blob container, so a learner and teacher can reach different replicas safely. Local development and explicit `DATABASE_URL` test runs use SQLite. No storage secret is baked into the image.

## Data and security

Room creation stores starter code, a random teacher token, and an expiry. Joining stores a chosen screen name and progress state. Learner edits are not sent in progress updates. Product pages load no advertising trackers. The preview iframe has no same-origin permission, and its CSP blocks network, forms, media, fonts, and base URL changes.

All API routes except `/health` use a per-IP fixed-window limit and honor the first valid `X-Forwarded-For` address. The default limit is 40 requests per second and returns `429` with `Retry-After: 1`.

See `/privacy` and `/terms` in the app for the user-facing policies.

## Billing

The free room limit is 10 learners. Room Plus uses the Sociobot hosted checkout and license verification APIs. No payment provider code or product ID is embedded here; the factory registers the slug at release.

## License

MIT. See [LICENSE](LICENSE). Bundled font notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
