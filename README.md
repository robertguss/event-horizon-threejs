# Event Horizon · Chapter One

A cozy toy-like Three.js adventure: **The Missing Moon Muffins**, **Special Delivery… Probably**, and **The Signal Beyond the Crater**. Read clues, help neighbors, reboot silly robots with bubbles, and visit the crater relay. Wrong answers explain the clues without removing progress. Buildings are exterior landmarks, not interiors.

## Run

```sh
npm install
npm run dev
npm test
npm run build
```

Touch: drag the left stick, tap the green proximity interaction button or round bubble button. Desktop: WASD/arrows, **E** to interact, **Space** for bubbles. Open the journal for objectives, rereadable notes, optional read-aloud, and a confirmed restart. Choose astronaut/alien/robot or daylight/twilight. Recenter returns to the current region’s courtyard. Optional synthesized sounds start muted.

Free play: drive the faster moon buggy, complete six course arches and return to arch 1 (untimed or optional timed), bubble three bowling robots and reset them, find Luma’s three babies after adventure one, and place earned flower planters/star lamps at home. Adventure two earns buggy paint colors.

Progress, character, rewards, decorations, paint, hidden aliens and lap records save locally on this browser/device. No cross-device sync. Storage-disabled browsers show a warning. Reload starts on foot at the port while retaining story progress; you can take the shuttle back to finish relay repairs.

All models are procedural original geometry. No paid services, API keys, accounts, microphone access, or analytics. Google Fonts has system-font fallbacks. ElevenLabs is not used.

Camera is elevated and automatic. Touch-first iPad landscape is the design target; Chromium touch emulation is not real iPad Safari verification. No educational efficacy or reading assessment claim. See `artifacts/game-progress.md` for playtest evidence and remaining risks.

`?debug` exposes read-only scene/story diagnostics for verification, never progress-changing helpers. Production render quality is capped at 1.5 DPR; immutable scenery is merged by material while interactive actors remain separate. `npm run build` produces `dist/` for a root-path static host. The existing supervised `little-orbit` service serves that directory on port 5173; rebuilding updates the preview. No paid API or deployment is required.
