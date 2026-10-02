# Event Horizon — Chapter One

## Approved scope
Three connected adventures: Missing Moon Muffins, Special Delivery… Probably, Signal Beyond the Crater. Free play includes robot bowling, a buggy course, earned home decorations and alien hide-and-seek. Preserve approved cozy toy-like visuals and interchangeable astronaut/alien/robot. Browser, touch-first iPad landscape; no Swift, accounts or paid APIs.

## Design brief and loop
Player promise: be the curious astronaut/alien/robot who helps a funny space neighborhood. Read useful notes, explore, bubble malfunctioning robots, make meaning-dependent choices, help neighbors and personalize home. Reading is untimed and rereadable; mistakes give information and never remove rewards. Combat has no death or health grind. Progress saves on the current browser/device. No demonstrated reading deficit or educational efficacy claim.

Player explores to solve a neighborhood problem; clues and silly guards shape decisions. Success grants a visible reward and opens the next adventure; incorrect choices leave progress intact and point to the relevant text. Optional toys remain accessible separately from comprehension tasks.

## Level plan
Port: courtyard start, rocket clues, guarded garden, blue moonberry patch/purple prickly plant, home and post office delivery recipients, buggy and outer-loop checkpoint course, bowling robots. Relay: separate compact crater plateau reached by shuttle; caretaker log, two sentries, cooling fan/battery/dish, console, return gate. Automatic elevated camera; proximity interaction button plus desktop E. One movement stick reused for buggy. Geometry colliders separate from model detail; custom arcade movement, no full physics simulation.

## Decisions / verification
Oracle consulted previously; new call attempted but unavailable (shared subscription limit). Follow prior advice, do not use a separately billed replacement. Free synthesized sound effects only, optional and muted by default; ElevenLabs untouched. Play length must be measured, not promised as 30–45 minutes.

## Current work
Integration implemented: main adapter connects chapter and world, proximity UI/E input, saved crew, region-aware sliding collision, faster buggy, objectives, journal, dialogue feedback, local save status, optional sound/read-aloud and activities. Port scenery and Pip are grouped and hidden on relay travel; region travel clears old bubble particles, and the buggy prompt is port-only. Immutable adventure scenery is merged by material, excluding actors, interactive markers, checkpoint gates, systems and reward slots.

Critical early-bubble fix: `canBubbleGuard` gates garden, parcel and relay hits to their respective story stages. Early bubbles remain playful but cannot consume the three-hit quest condition. Bowling remains independent. Unit regression covers all four story guard IDs.

`npm test`: 6 passing Node tests (ordering, wrong inference/fruit/delivery/power choices, duplicate events, both sentries, console requirement, rewards, save roundtrip and free-play records). Production build passes; Vite warns about the approximately 601 kB JS chunk (163 kB gzip), mostly Three.js. Initial port draw calls reduced from 294 to about 226 by adventure scenery batching; approximately 155k visible triangles, 232 geometry resources. This is renderer evidence, not iPad FPS evidence.

Real-input browser QA completed against the existing supervised static `dist` service, not Vite development output. Browser automation used UI choices and keyboard movement/touch taps, consulting read-only diagnostics for navigation/assertions; no progress-forcing hooks. The route reached every chapter stage through `finished`, including wrong inference, fruit, delivery and power choices, early guard bubbles, and relay travel. An initial side-activity navigation harness stalled at a tight waypoint; the resumed run completed the buggy lap and bowling. Saved state restored all three adventures, three hidden aliens, a star lamp, coral paint and a completed lap.

Final browser verification after rebuilding passed at 1180×820 / 2× with Chromium touch enabled (`pointer: coarse` true): simultaneous movement and bubbles, touch cancellation clearing movement, audio unlock/mute, read-aloud activation/close, and saved progression. Browser exceptions: zero. Port, relay and completion-dialog captures were inspected. The orb's software WebGL is extremely slow, so traversal used a reduced viewport; target-resolution captures and touch checks were separate. Real iPad Safari performance and child playtime remain unverified. The production build retains the nonblocking large-chunk warning.

Visual screenshot baselines remain deferred while chapter content is exploratory; inspect current captures instead. Skills loaded: threejs-game-director, threejs-qa-release (release-checks reference), using-agent-browser (version-matched core guide).
