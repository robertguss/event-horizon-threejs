// Explicit authoring step only. Never imported by the browser or ordinary builds.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { passages, deliveryNotes } from '../src/story.js';

const cast = {
  pip: 'TX3LPaxmHKxFdv7VOQHJ', // Liam: energetic
  luma: 'cgSgspJ2msm6clMCkdW9', // Jessica: warm/playful
  narrator: 'JBFqnCBsd6RMkjVDRZzb', // George: storyteller/caretaker
};
const source = await readFile(new URL('../src/chapter.js', import.meta.url), 'utf8');
// The chapter uses single-quoted prose literals. Keep dynamic/status text on TTS.
const prose = [...source.matchAll(/'([^'\n]*)'/g)].map(m => m[1])
  .filter(text => text.length > 60 && /^[A-Z“]/.test(text) && text.includes(' ') && !text.includes('=>'));
const texts = [...new Set([...Object.values(passages), ...deliveryNotes.map(n => n.text), ...prose])];
const output = new URL('../public/audio/voices/', import.meta.url);
await mkdir(output, { recursive: true });
const entries = texts.map(text => {
  const role = text === passages.muffins || text.startsWith('Pip:') || text.startsWith('“My favorite') ? 'pip'
    : text === passages.food || text.startsWith('Luma:') || text.startsWith('“Our babies') ? 'luma' : 'narrator';
  const spoken = text.replace(/^(Pip|Luma|Caretaker):\s*/, '').replace(/ — (Pip|Luma)$/, '');
  const id = createHash('sha256').update(text + cast[role]).digest('hex').slice(0, 16);
  return { text, spoken, role, voiceId: cast[role], file: `audio/voices/${id}.mp3` };
});
const chars = entries.reduce((sum, e) => sum + e.spoken.length, 0);
console.log(`${entries.length} recordings; ${chars} input characters; model eleven_multilingual_v2.`);
if (chars > 9000) throw new Error('Authoring budget exceeded. Review the script before generating.');
if (!process.argv.includes('--generate') && !process.argv.includes('--samples')) {
  console.log('Dry run. Use --samples to audition the three mission passages, then --generate.');
  process.exit(0);
}
const key = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error('Missing ElevenLabs authoring credential.');
const selected = process.argv.includes('--samples') ? entries.slice(0, 3) : entries;
for (const entry of selected) {
  const path = new URL(entry.file.replace('audio/voices/', ''), output);
  try { await access(path); console.log(`Cached ${entry.role}: ${entry.file}`); continue; } catch {}
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${entry.voiceId}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: entry.spoken, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: .45, similarity_boost: .75, style: .3, use_speaker_boost: true } }),
  });
  if (!response.ok) throw new Error(`Generation stopped (${response.status}): ${await response.text()}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
  console.log(`Generated ${entry.role}: ${entry.file}`);
}
// Only reference recordings that actually exist; interrupted runs safely reuse them.
const manifest = {};
for (const entry of entries) {
  try { await access(new URL(entry.file.replace('audio/voices/', ''), output)); }
  catch { continue; }
  manifest[entry.text] = { file: entry.file, role: entry.role, voiceId: entry.voiceId };
}
await writeFile(new URL('../src/voice-manifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
