# Polish 2 — cumulative review disposition

Repair commit: `5f6c09eb282f0e695d4f68d485d658fb5923ef24`  
Live URL: <https://lesson-code-room.sociobot.in>

Every finding in `.factory/review-1.md`, `.factory/polish-1.md`, and
`.factory/review-2.md` was rechecked. Evidence screenshots are captured at
`/tmp/lesson-code-room-polish-2-landing.png`,
`/tmp/lesson-code-room-polish-2-demo.png`, and
`/tmp/lesson-code-room-polish-2-404.png` during the final live check.

| Finding | Change or retained verified repair | Evidence |
| --- | --- | --- |
| F-1-1 | `?demo=1` paints the populated sample teacher room before its API request resolves, then binds the isolated learner link. | `@claim:demo-sample-data`; demo screenshot; live `/?demo=1`. |
| F-1-2 | Responsive grids, header, banner, and workbench wrap at 390 px/200% text without horizontal panning. | `200 percent text reflows every public route on a 390px phone`; landing and legal live checks. |
| F-1-3 | The unsupported private-screen wording remains removed; the remaining teacher-visibility wording is claimed. | `@claim:teacher-report-limits`; live landing check. |
| F-1-4 | Route metadata updates title, description, canonical, Open Graph, and Twitter values on every route. | `each route updates plain-language and social metadata`; live `/`, `/demo`, `/privacy`, `/terms`, and 404 checks. |
| F-1-5 | Removed the hero slogan. | Copy audit and landing screenshot. |
| F-1-6 | Removed the context-free creator eyebrow. | Copy audit and live landing check. |
| F-1-7 | Removed the context-free process eyebrow. | Copy audit and live landing check. |
| F-1-8 | Removed the metaphorical surveillance eyebrow. | Copy audit and live landing check. |
| F-1-9 | README test explanation remains split into two short sentences. | README audit; clean-clone test gate. |
| F-1-10 | README storage explanation remains split into two short sentences. | README audit; clean-clone test gate. |
| F-2-1 | Demo identifiers use the `DEMO-` namespace. Local/test runs use memory; deployed replicas use the separate `lesson-code-room-demo` Blob container. Live room code cannot write or resolve demo storage. | `@claim:demo-storage-isolation`; `src/main.rs` separation test; live `/demo` flow. |
| F-2-2 | Added the `demo-sample-data` inventory entry and exact first-render assertion for all three named states. | `@claim:demo-sample-data`; landing and demo screenshots. |
| Verification-6 P2 | Blob lease exhaustion now returns retryable `503` with `Retry-After: 1`, not HTTP 500. | Rust `room_busy_responses_are_retryable_not_server_errors`. |

The catalog description is now verb-first and 75 characters: “Run a shared
coding exercise and see learner progress without student accounts.”
