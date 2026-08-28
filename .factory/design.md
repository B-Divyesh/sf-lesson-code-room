# Lesson Code Room visual thesis

## Direction

**Cinematic environmental art: the lamp-lit night classroom.** A remote lesson can feel like ten isolated browser windows. This product turns them into one quiet room seen after dusk: a teacher's pool of amber light, learner desks as small lit windows, and the blue-black outside world kept at a distance. The art explains the job instead of decorating it. The interface borrows the scene's sightlines, warm work surfaces, and visible signals.

This is a deliberately single-mode, dark environment. It reduces glare beside a code editor and makes learner state changes readable without resembling a generic developer dashboard.

## Tokens

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Night | `--night` | `#0b1318` | Page background |
| Deep wall | `--wall` | `#142129` | Raised surfaces |
| Desk | `--desk` | `#1d3038` | Inputs and editor chrome |
| Chalk | `--chalk` | `#f4efe3` | Main text |
| Mist | `--mist` | `#b8c7c9` | Muted text |
| Lamp | `--lamp` | `#ffc857` | Primary action and focus |
| Lamp ink | `--lamp-ink` | `#201503` | Text on lamp |
| Signal | `--signal` | `#71d6a4` | Ran / connected |
| Sky | `--sky` | `#78b9d4` | Links and secondary actions |
| Ember | `--ember` | `#ff8a70` | Error / destructive action |

All text pairings meet WCAG AA. State always includes a word or symbol; color is never the only signal.

## Type

- Display: `Fraunces`, self-hosted variable serif, 600–700. Its soft optical forms give the room an editorial teaching voice instead of an IDE brand voice.
- Body and UI: `Atkinson Hyperlegible`, self-hosted, 400/700. Its distinct glyphs support scanning, code-adjacent controls, and low-resolution screen shares.
- Code: platform monospace stack. No third font payload.

## Spacing and shape

- Base grid: 8 px. Main steps: 8, 16, 24, 32, 48, 72, 96.
- Content measure: 68 characters. Wide workbench: 1440 px.
- Corners are clipped like paper on a drafting desk: `4px 18px 4px 18px`. Pills are reserved for live state.
- One-pixel cool borders sit inside warm pools of light. Shadows are broad and low-opacity, like desk lamps rather than floating cards.

## Layout rhythm

The landing page is an oblique two-column scene, not a centered hero. Copy occupies the left sightline; the original classroom scene opens on the right. Section boundaries use wide bands like changes in wall and floor material. In the app, the code workbench takes space first and chrome recedes.

On phones, art becomes a shallow establishing shot. Teacher signals stack beneath the action. Editor tabs stay visible and the preview moves below the code.

## Interaction grammar

- Primary actions switch on a lamp: a brief amber edge travels across the button.
- Learner progress advances through named states: **Joined → Ran code → Done**.
- Teacher lists update in place without attention-grabbing movement.
- Copy-link actions immediately change their label to **Copied join link**.
- Destructive reset actions name the consequence and require confirmation where shared work is affected.

## Motion

At first paint, the scene reveals from dark with a 500 ms opacity and 12 px transform. Controls use 160–220 ms opacity/transform transitions. No element loops. With `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and state changes are instant.

## Asset plan and provenance

Hero and social imagery are generated as original raster assets with the factory image model, then reviewed and exported to WebP/AVIF. Hand-authored SVG supplies the favicon and small interface marks.

### Prompt sheet

**Subject:** an empty, intimate coding classroom after dusk; ten small desks facing a teacher desk; open laptops show abstract colored rectangles only; one warm pendant lamp; rain-dark windows; a subtle sense that separate learners are connected.

**World and materials:** cinematic architectural concept art, matte painted walls, dark wood, worn linoleum, paper notes, restrained realistic detail.

**Light and lens:** wide 35 mm lens from a corner at seated eye level, deep blue ambient dusk, warm amber practical light, soft volumetric atmosphere, controlled highlights.

**Palette words:** blue-black, slate teal, chalk cream, tungsten amber, tiny mint signals.

**Negative list:** no people, no legible text, no logos, no watermarks, no brands, no neon cyberpunk, no sci-fi holograms, no gradient blobs, no exaggerated depth of field.

### Generation record

- Model: `factory-image` through `/opt/fleet/lib/gen-image.sh`
- Date: 2026-08-28
- License: original generated work for Lesson Code Room; no third-party visual assets.
- Exact prompts are stored beside source images in `assets/src/*.json`.
