# Polish 1 — review finding disposition

Candidate repaired: `f4ebfec667cb299834f5b5a9132bd752ca81c246`  
Released: `498c085cb9385397fd2cd5a0de9aee7940469e70`

All finding IDs from `.factory/review-1.md` are resolved.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | `/?demo=1` now synchronously renders the populated teacher sample with Moss Finch, Blue Comet, and Quiet Fox before the temporary API room resolves; it then binds a real isolated learner link. | `one click renders the populated isolated sample before its room request resolves`; live `/?demo=1`; `/tmp/lcr-polish-1-final-demo.png` and `final-audit.json`. |
| F-1-2 | Removed reflow-inducing grid minimums, made header/banner controls wrap, added mobile single-column learner signals, and sized the 404 at zoom. | `200 percent text reflows every public route on a 390px phone`; live audit records 390/390 on `/`, `/?demo=1`, `/privacy`, `/terms`, and `/missing-classroom`. |
| F-1-3 | Replaced the untested private-screen promise with the already claimed and tested `Teachers see screen names and Joined, Ran code, or Done.` | `@claim:teacher-report-limits teacher reports contain progress but no grades or detailed activity`; landing live audit. |
| F-1-4 | `setMeta` now updates Open Graph and Twitter title/description as well as title, description, and canonical. | `each route updates plain-language and social metadata`; live audit of landing, demo, Privacy, Terms, and 404. |
| F-1-5 | Deleted `One room. One exercise. Start teaching.` from the hero. | `.factory/copy-audit.md`; live landing screenshot `/tmp/lcr-polish-1-final-landing.png`. |
| F-1-6 | Deleted the context-free `The real first step` eyebrow. | `.factory/copy-audit.md`; live landing check. |
| F-1-7 | Deleted the context-free `A short teaching loop` eyebrow. | `.factory/copy-audit.md`; live landing check. |
| F-1-8 | Deleted the metaphoric `A room, not a watchtower` eyebrow. | `.factory/copy-audit.md`; live landing check. |
| F-1-9 | Split the 23-word README test sentence into two plain sentences. | README at commit `498c085`. |
| F-1-10 | Split the 31-word README container sentence into two plain sentences. | README at commit `498c085`. |

## Cumulative earlier findings

Read all earlier verifier reports. Their former storage, demo-banner, 404 contrast, history race, paid-capacity claim, Docker image, privacy-target, rate-limit, metadata, and claim-inventory findings remain covered by the 35-test suite. The live 404 zoom issue found during this polish pass was fixed in `498c085` and independently rechecked before handoff.

## Claim gate

The final clean clone `/tmp/lesson-code-room-polish-final-VJ00Lk` passed `npm ci` and all 16 exact `claims.json` commands individually. Full final `npm test` passed in the source checkout. See `.factory/handoff.md` for the complete command and live evidence list.
