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

All models are procedural original geometry. Gameplay uses no API keys, accounts, microphone access, analytics or paid API requests. Google Fonts has system-font fallbacks. Voice recordings were authored with ElevenLabs; playback serves local MP3 assets.

## Voiceovers

Read aloud plays recorded paragraphs in sequence, highlights the current paragraph and toggles to Stop reading. Dialogue changes, close, backgrounding and page exit stop narration. Text remains available and audio never starts automatically. Short/dynamic text or a missing recording uses browser speech when available. The decorative dialog title is not narrated. Effects mute is independent of explicitly requested narration.

Cast: Liam (`TX3LPaxmHKxFdv7VOQHJ`) for Pip; Jessica (`cgSgspJ2msm6clMCkdW9`) for Luma; George (`JBFqnCBsd6RMkjVDRZzb`) for the caretaker and narration. `src/voice-manifest.json` maps exact visible text to recordings under `public/audio/voices/`. The generation script removes character name prefixes/attributions from spoken character lines. Format: MP3 44.1 kHz/128 kbps, `eleven_multilingual_v2`, stability 0.45, similarity 0.75, style 0.3, speaker boost enabled. No cloning or impersonation.

`node scripts/generate-voices.mjs` is a dry run. `--samples` generates three audition passages; `--generate` explicitly consumes provider credits for missing files, reusing existing recordings. It reads `ELEVEN_LABS_API_KEY` or `ELEVENLABS_API_KEY` from the authoring environment only, never from Vite or client code. Ordinary tests/builds do not generate audio. The current batch is 56 clips / 6,208 input characters / approximately 6.3 minutes. Review your ElevenLabs plan's distribution terms before publishing the generated assets.

For an authoring key, restrict access to Text to Speech and Voices Read; all other scopes can be disabled for this workflow. Set a small credit quota. The key can be disabled entirely between authoring sessions without affecting gameplay. See [ElevenLabs key restrictions](https://elevenlabs.io/docs/api-reference/authentication).

Camera is elevated and automatic. Touch-first iPad landscape is the design target; Chromium touch emulation is not real iPad Safari verification. No educational efficacy or reading assessment claim. See `artifacts/game-progress.md` for playtest evidence and remaining risks.

`?debug` exposes read-only scene/story diagnostics for verification, never progress-changing helpers. Production render quality is capped at 1.5 DPR; immutable scenery is merged by material while interactive actors remain separate. `npm run build` produces `dist/` for a root-path static host. The existing supervised `little-orbit` service serves that directory on port 5173; rebuilding updates the preview. No paid API or deployment is required.
