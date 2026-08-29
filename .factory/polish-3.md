# Polish 3 — cumulative finding disposition

Date: 2026-08-29
Repair commit deployed: `e3a570da5ef9f784583f06ab81533892095f6767`
Live URL: <https://lesson-code-room.sociobot.in>

Every finding in `.factory/review-1.md`, `.factory/review-2.md`, and `.factory/review-3.md` was rechecked against the deployed repair. No finding remains open.

| Finding | Change made or retained repair | Evidence |
| --- | --- | --- |
| F-1-1 | `/?demo=1` paints the full sample teacher room before `/api/demo` completes, then binds the isolated room. | Test: `@claim:demo-sample-data one click opens three named learner progress states before the demo request resolves`. Screenshot: `.factory/evidence/polish-3/live-demo-immediate-mobile.png`. Live: `/?demo=1` showed the exercise and all three signals while the API response was held. |
| F-1-2 | Responsive grids and controls reflow at 390 px with 200% root text. | Test: `200 percent text reflows every public route on a 390px phone`. Screenshots: `live-landing-mobile.png`, `live-demo-immediate-mobile.png`, and `live-404-mobile.png`. Live: `/`, `/?demo=1`, `/privacy`, `/terms`, and the 404 each measured 390/390. |
| F-1-3 | The unsupported private-screen promise remains removed. The page states only the observable teacher fields. | Test: `@claim:teacher-report-limits teacher reports contain progress but no grades or detailed activity`. Screenshot: `live-landing-desktop.png`. Live `/`: `Teachers see screen names and Joined, Ran code, or Done.` |
| F-1-4 | Every route sets its title, description, canonical, Open Graph, and Twitter text. | Test: `each route updates plain-language and social metadata`. Screenshot: `live-404-desktop.png`. Live: all five route records pass in `live-audit.json`. |
| F-1-5 | The information-free hero slogan remains deleted. | Test: `landing page states the job and fits a phone`; the live audit also rejects the old phrase. Screenshot: `live-landing-mobile.png`. Live `/` starts with the job headline. |
| F-1-6 | `The real first step` remains deleted; `Set one exercise` names the section. | Test: `landing page states the job and fits a phone`; live audit old-copy assertion. Screenshot: `live-landing-desktop.png`. Live `/` checked. |
| F-1-7 | `A short teaching loop` remains deleted; `How the room works` names the section. | Test: `landing page states the job and fits a phone`; live audit old-copy assertion. Screenshot: `live-landing-desktop.png`. Live `/` checked. |
| F-1-8 | The watchtower metaphor remains removed; the section says `Teach without surveillance` and explains the visible data. | Test: `@claim:teacher-report-limits teacher reports contain progress but no grades or detailed activity`. Screenshot: `live-landing-desktop.png`. Live `/` checked. |
| F-1-9 | The README test explanation remains split into 11- and 10-word sentences. | Source and `.factory/copy-audit.md` check; clean-clone `npm test` passed. Screenshot: `live-landing-desktop.png` confirms no corresponding app regression. Live `/` checked. |
| F-1-10 | The README container explanation remains split into 14- and 9-word sentences. | Source and `.factory/copy-audit.md` check; clean-clone `npm test` passed. Screenshot: `live-landing-desktop.png` confirms no corresponding app regression. Live `/health` reports the deployed build. |
| F-2-1 | Demo IDs use `DEMO-`; local demos use memory; deployment uses the separate `lesson-code-room-demo` Blob container. Live room operations cannot resolve the demo tenant. | Test: `@claim:demo-storage-isolation demo activity uses a temporary isolated tenant, not the live room store`. Screenshot: `live-demo-immediate-mobile.png`. Live `/?demo=1`: API reported `demo-blob` and a `DEMO-*` identifier; reset produced a different room. |
| F-2-2 | The claim inventory names the exact three sample learners and their states. The synchronous rendering test asserts all three before the API resolves. | Test: `@claim:demo-sample-data one click opens three named learner progress states before the demo request resolves`. Screenshot: `live-demo-immediate-mobile.png`. Live `/?demo=1` showed Moss Finch—Done, Blue Comet—Ran code, and Quiet Fox—Joined. |
| F-3-1 | Replaced the metaphorical 404 H1 with `Page not found`; kept the recovery sentence and `Return home` action. | Test: `unknown routes explain the error in plain words`. Screenshots: `live-404-mobile.png` and `live-404-desktop.png`. Live `/missing-classroom` returned HTTP 404 with the exact H1. |

## Earlier regression findings

The clean-clone 37-test suite also reconfirmed the earlier verifier fixes: cross-replica storage, TypeScript checking, learner reset claim coverage, persistent demo banners, 404 contrast, Back/Forward race cancellation, paid 30-learner capacity, rolling Rust builder, 44 px privacy link, trusted forwarded-address selection, overload 503 handling, and immutable hashed-asset caching.

During this pass, the generated JS hash began with `-`. That exposed an unhandled valid Vite filename (`index--x8rlptg.js`) in cache detection. The parser now accepts eight-character URL-safe hashes for generated JS, CSS, and fonts while excluding stable artwork. Rust unit `only_content_hashed_assets_receive_immutable_caching` and browser test `hashed production assets use the immutable cache policy` pass; the live `HEAD` response is recorded in `live-http-audit.json`.

The final 200% screenshot review also found crowded footer links even though the page had no horizontal overflow. The footer now wraps with non-shrinking link targets, and the reflow test plus live audit assert that every link stays inside the viewport without overlap.

## Claim and quality evidence

- All 18 commands in `.factory/claims.json` passed individually in clean clone `/tmp/lesson-code-room-polish-3-Gk4Us4`.
- Final revision clean clone: `/tmp/lesson-code-room-polish-3-final-TapIET` at `e3a570d`; all 18 claims passed together.
- Full clean-clone `npm test`: 4 Rust tests and 37 Playwright tests passed.
- `npx tsc -p frontend/tsconfig.json --noEmit`, `cargo fmt --all -- --check`, and strict Clippy passed.
- Live browser audit: `.factory/evidence/polish-3/live-audit.json`.
- Live HTTP, header, rate-limit, and load audit: `.factory/evidence/polish-3/live-http-audit.json`.
- Factory URL verifier: `.factory/evidence/polish-3/verify-url/verify.json`; no console errors.
- Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100; `.factory/evidence/polish-3/lighthouse.json`.

The visual direction remains the original lamp-lit night classroom. No generic template, external font, tracking script, or decorative AI feature was introduced.
