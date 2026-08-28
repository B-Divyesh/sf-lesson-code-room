# Independent verification 4 — FAIL

Date: 2026-08-28  
Work order: `lesson-code-room-verify-4`  
Candidate: `8100b1e95bf2c3cb929832e74878f8fdd5fa3069`  
Live URL: https://lesson-code-room.sociobot.in

## Verdict

**FAIL — do not release.** The live deployment is the requested candidate and the main teacher/learner flow works, but there are multiple release blockers. The advertised paid checkout is unavailable, demo reset leaks the previous room back into the new view, demo learners lose the required sandbox banner, rate limiting is bypassed by a client-supplied header, progress can regress from Done to Ran code, and the real 404 page has a serious axe violation.

No product code was changed during this verification.

## Release-blocking findings

### P1 — the advertised Room Plus checkout returns 404

The live landing page advertises **Room Plus: $29 once** and links **Buy Room Plus** to the required Sociobot URL. A fresh direct request to that exact live link returned:

```text
GET https://api.sociobot.in/api/v1/products/lesson-code-room/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

The verify endpoint is reachable and returned a normal invalid-token verdict, and the in-page invalid-license recovery worked. A visitor still cannot buy the advertised product. This is a live registration/configuration failure and is release-blocking even though the candidate code points to the correct host.

### P1 — Reset demo is not isolated from the previous demo room

A live demo room `TBPNDP` was opened and learner **Old Room Only** joined it. **Reset demo** changed the learner link to new room `HHCMHS`. One second later, **Old Room Only** from `TBPNDP` appeared on the new room's signal board.

The previous polling loop remains active after reset and writes old-room results into the new-room DOM. This contradicts the `demo-reset` claim that reset creates a fresh room. The declared test passes because it checks the changed link and seeded names immediately, not whether prior data later returns.

### P1 — demo mode loses its required banner and controls

The live `/demo` teacher view has **Demo — sample data, nothing is saved**, **Reset demo**, and **Start for real**. Following its learner link produced zero matches for all three controls on both the join screen and workbench. The mandatory persistent demo identity is therefore absent while a visitor is still using the demo room. This also contradicts `.factory/demo.md`, which says the banner identifies demo mode on every demo view.

### P1 — public clients can bypass every API rate limit

A 48-request live burst with the normal network identity returned 39 ordinary responses and 9 `429` responses. Every `429` had `Retry-After: 1`. Repeating the burst while changing the client-supplied `X-Forwarded-For` value on every request returned 48 ordinary responses and **zero 429s**.

The server trusts the first `X-Forwarded-For` value, and the public ingress passes a caller-provided value through. An unauthenticated client can therefore evade the mandatory rate limit. The in-memory key map also retains each spoofed address, adding an unbounded-memory abuse path.

For completeness, fixed-identity 48-request bursts against all six API route/method combinations did return 429s. During that run each route handled 26 requests and limited 22, with `Retry-After: 1` on every limited response:

- `POST /api/demo`
- `POST /api/rooms`
- `GET /api/rooms/:id`
- `POST /api/rooms/:id/join`
- `POST /api/rooms/:id/progress`
- `GET /api/rooms/:id/progress`

The observed fleet threshold varied between 26 and 39 ordinary responses as two or three replicas served a burst. The bypass means the nominal threshold is not an effective protection.

### P1 — Done progress regresses while the learner UI still says done

On a live demo, learner **State Order** selected **Mark as done**. Both views showed Done. The learner then selected **Run the page**. The teacher view changed the learner back to **Ran code**, while the learner's button still read **Marked as done**. This violates the documented `Joined → Ran code → Done` progression and makes the product's core progress signal internally inconsistent.

### P1 — the real 404 page has a serious axe failure

The server correctly returned HTTP 404 and a designed recovery page, but axe 4.10.2 reported `color-contrast` with serious impact on `.door-number`. The `#273a42` text against `#0b1318` measured **1.57:1**; large text requires 3:1. The acceptance baseline allows no serious or critical axe findings.

## Other findings

### P2 — learner JavaScript failures are hidden

Running `throw new Error('QA deliberate runtime failure')` produced a page error from the sandbox, showed no visible error text, and still told the learner **Teacher can see: Ran code**. Invalid learner code needs a visible error and recovery cue; otherwise a learner cannot distinguish a successful run from a failed one.

### P2 — several mobile link targets are smaller than 44×44 px

At 390 px, the wordmark measured 152×36.9 px, the Demo navigation link 38×44 px, and footer links measured 18 px high (Privacy 43×18, Terms 39×18, external factory link 140×18). Keyboard focus itself is visible with a 3 px amber outline, but these targets miss the attached 44 px touch baseline.

### P2 — learner names and progress responses lack an explicit no-store policy

Fresh `GET /api/rooms/:id/progress` responses contain learner screen names and states but have no `Cache-Control`, `Pragma`, or `Expires` header. Short-lived classroom data should be sent with `Cache-Control: no-store` rather than relying on browser or intermediary heuristics.

### P2 — unversioned images are cached immutable for one year

The backend applies `Cache-Control: public, max-age=31536000, immutable` to all `/assets/*`, including unversioned `classroom-hero.webp`, `classroom-hero-900.webp`, and `social-card.webp`. Only content-hashed assets should be immutable; otherwise later art updates at those URLs remain stale for returning visitors.

### P2 — paid terms omit required merchant/refund wording

The Terms page says Sociobot hosts checkout and verifies the license, but does not say that Sociobot/Dodo is merchant of record or that refunds are handled there and revoke the license, as required by the paid-unlock contract.

## Required first gates

### Cold first-read — PASS

A fresh 1440×900 browser context loaded `/` with HTTP 200. The first screen answers all three questions in plain words:

- What: **Run one coding exercise together**.
- For whom: **For remote teachers who need learners coding now, with clear progress and no student accounts.**
- What to click: **Try it with sample data**, beside **A sample room opens with three learners.**

The action reaches `/demo` in one click and immediately shows Moss Finch, Blue Comet, and Quiet Fox. The first load had no console or page errors.

### Declared claim commands — PASS after clean install (16/16)

The required lockfile install completed with 26 packages and zero npm vulnerabilities. Every exact command in `.factory/claims.json` then passed independently:

| Claim | Result |
| --- | --- |
| `anonymous-room` | PASS |
| `custom-room` | PASS |
| `sandbox-run` | PASS |
| `demo-reset` | PASS in its declared test; independently falsified by the stale-poller case above |
| `learner-reset` | PASS |
| `privacy-code` | PASS |
| `teacher-report-limits` | PASS |
| `product-scope` | PASS |
| `no-tracking` | PASS |
| `session-storage` | PASS |
| `offline-preview` | PASS |
| `rate-limit` | PASS for a fixed header; independently bypassed as described above |
| `free-capacity` | PASS |
| `room-retention` | PASS |
| `demo-retention` | PASS |
| `paid-checkout` | PASS only against a mocked/structural assertion; the real checkout returns 404 |

A literal pre-install invocation of the commands could not start because a clean clone has no `node_modules` (`vite: not found`). This was dependency bootstrap, not a failed product assertion; all commands passed after the required `npm ci`.

The landing page, legal pages, README, and visible workbench copy were also cross-checked against the inventory. The reset, privacy, scope, retention, capacity, and purchase statements have entries. The false live outcomes above show gaps in test coverage rather than missing IDs.

## Independent verification evidence

| Area | Result and evidence |
| --- | --- |
| Candidate/live match | PASS. Live `/health` returned `{"build_sha":"8100b1e95bf2c3cb929832e74878f8fdd5fa3069","ok":true}`. Live and local HTML, JS, and CSS SHA-256 hashes matched exactly. |
| Full local suite | PASS. `npm test` built `dist/`, passed 2 Rust tests, and passed 22/22 Playwright tests. |
| Type/lint/release checks | PASS. `npx tsc --noEmit -p frontend/tsconfig.json`, `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features -- -D warnings`, and `cargo build --locked --release` passed. |
| Runtime contract | PASS. The release binary started with an empty environment except `PATH` and `PORT=4280`, served the site, reported build `dev`, used the documented local SQLite fallback, and retained room `NXHPBG` across a stop/start. |
| Normal live journey | PASS apart from defects above. A fresh demo opened, reset to a different room, an anonymous learner edited all three files, rendered the result, continued editing/preview while offline, reset starter code by keyboard, marked Done, and appeared in the teacher view. |
| Boundaries/recovery | PASS for server validation. Blank/81-character titles, 601-character instructions, 50,001-byte HTML, blank/25-character names, invalid progress, wrong learner token, and missing teacher token returned specific 400/403 errors. Ten learners joined; the 11th got `409 room_full`. Lowercase room lookup returned 200. |
| Concurrency | PASS. 100 simultaneous live room reads from distinct limiter identities returned 100×200 in 418 ms. |
| Privacy/outbound | PASS for the normal demo flow. All HTTP(S) page requests remained on `lesson-code-room.sociobot.in`; only an explicit license check contacts `api.sociobot.in`. No analytics, advertising, camera, microphone, sign-in, or raw AI provider calls were found. |
| Headers/CORS/sandbox | Main routes have CSP, `nosniff`, strict referrer policy, frame denial, and camera/microphone/geolocation denial. `/sandbox.html` has `connect-src 'none'`, no forms/media/fonts/base URL, and `SAMEORIGIN`. Hostile-origin preflight returned 405 without an allow-origin header. |
| Routes and links | `/`, `/demo`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and `/sandbox.html` returned 200. Unknown paths returned 404. Internal links and the factory footer link resolved; the paid checkout is the broken link documented above. |
| Accessibility | `/opt/fleet/lib/verify-url.sh` passed the landing page in 738 ms. Live axe found no serious/critical issue on landing, demo teacher, join, workbench, privacy, or terms. The 404 exception is release-blocking. Keyboard tab order and tab-arrow operation passed; normal 390 px pages had no horizontal overflow. Reduced motion produced a 0.01 ms, one-iteration hero animation. |
| Performance | Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.5 s, LCP 1.7 s, TBT 0 ms, CLS 0.021. Production output: JS 27.65 KB raw / 8.95 KB gzip; CSS 17.50 KB raw / 4.71 KB gzip; fonts 71.35 KB raw; mobile hero 22.32 KB. Budgets pass. |
| PWA/library/sign-in checks | Not applicable. This is not a PWA, package/CLI, or sign-in product. |

## Verification limitation

No Docker-compatible engine (`docker`, `podman`, `buildah`, or `nerdctl`) exists in this verifier container, so the Dockerfile could not be rebuilt locally. The locked frontend and Rust release builds passed, the release binary passed the no-config runtime/restart checks, the Dockerfile was inspected for multi-stage/non-root/build-arg behavior, and the deployed build identity matched exactly.

## Retest gate

1. Make the live checkout resolve to an enabled Sociobot product.
2. Cancel the old teacher polling loop before provisioning/resetting a demo, and prove old-room learners never reappear.
3. Carry the demo banner, Reset demo, and Start for real controls into demo join/workbench views.
4. Derive client identity only from a trusted ingress value and bound/expire limiter keys; prove rotating caller headers cannot bypass 429s.
5. Make progress monotonic or make the Done control/state accurately revert together.
6. Fix the 404 contrast and all sub-44 px mobile targets; rerun axe on every route including 404.
7. Surface sandbox runtime errors, add no-store to participant/progress APIs, version immutable image URLs, and complete the paid legal copy.
8. Add regression tests for every case above, rerun every claim command, deploy, and repeat this independent live verification.
