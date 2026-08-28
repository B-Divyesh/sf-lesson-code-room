# Demo sandbox

## Entry point

- Local: `http://localhost:8080/demo`
- Production: `https://lesson-code-room.sociobot.in/demo`

No account, key, or setup is required. A direct visit sends `POST /api/demo`, which creates a random demo room with a two-hour TTL.

## Sample data

The exercise is **Make the night sky respond**. It includes a styled night-sky card, three stars, and a button with a small JavaScript response. The teacher signal board begins with:

- Moss Finch — Done
- Blue Comet — Ran code
- Quiet Fox — Joined

The learner link on the page opens a real editable workbench for that temporary room.

## Isolation and reset

Demo rooms use random room and teacher tokens and are marked `is_demo` in SQLite. They never read or modify live rooms. They expire after two hours and are removed by normal cleanup. The browser stores no demo identifier in local or session storage.

**Reset demo** provisions a new random demo room. **Start for real** leaves the demo and opens the live room creator. The persistent banner identifies demo mode on every demo view.

## Verifier path

1. Open `/demo` in a fresh browser context.
2. Confirm the three seeded learner signals.
3. Open the displayed learner link.
4. Join with any screen name.
5. Edit HTML or JavaScript and select **Run the page**.
6. Confirm the result in the isolated preview.
7. Return to the teacher page and confirm **Ran code**.
8. Select **Reset demo** and confirm the room link changes.

The automated form of this path lives in `tests/product.spec.ts`.
