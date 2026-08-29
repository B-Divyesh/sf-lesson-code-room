# Demo sandbox

## Entry point

- Local: `http://localhost:8080/?demo=1` (also `/demo`)
- Production: `https://lesson-code-room.sociobot.in/?demo=1` (also `/demo`)

No account, key, or setup is required. The sample teacher room renders immediately, then `POST /api/demo` creates a random demo room with a two-hour TTL and replaces the temporary learner link.

## Sample data

The exercise is **Make the night sky respond**. It includes a styled night-sky card, three stars, and a button with a small JavaScript response. The teacher signal board begins with:

- Moss Finch — Done
- Blue Comet — Ran code
- Quiet Fox — Joined

The learner link on the page opens a real editable workbench for that temporary room.

## Isolation and reset

Demo rooms use `DEMO-` room IDs and a dedicated demo tenant. They never read or write the live SQLite or Azure Blob room store. Local and test demos use process memory. Deployed replicas use the separate `lesson-code-room-demo` Blob container so a learner can reach any replica. Demo data expires after two hours and cannot be resolved by the live-store path. The browser stores no demo identifier in local or session storage. Production live rooms use a different shared Azure Blob container through the service's managed identity; explicit local test URLs use SQLite.

**Reset demo** provisions a new random demo room. **Start for real** leaves the demo and opens the live room creator. The persistent banner identifies demo mode on every demo view.

## Verifier path

1. Open `/demo` in a fresh browser context.
2. Confirm the three seeded learner signals.
3. Open the displayed learner link.
4. Join with any screen name.
5. Edit HTML or JavaScript and select **Run the page**.
6. Confirm the result in the isolated preview.
7. Edit all three files, select **Reset starter code**, accept the warning, and confirm the starter fields and preview return.
8. Return to the teacher page and confirm **Ran code**.
9. Select **Reset demo** and confirm the room link changes.

The automated form of this path lives in `tests/product.spec.ts`.
