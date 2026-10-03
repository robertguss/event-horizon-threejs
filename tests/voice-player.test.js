import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { createVoicePlayer } from '../src/voice-player.js';
import manifest from '../src/voice-manifest.json' with { type: 'json' };
import { passages } from '../src/story.js';

function setup() {
  const button = { textContent: '', attrs: {}, setAttribute(k,v) { this.attrs[k]=v; } };
  const lines = [], pending = [];
  const media = { sources: [], src: '', pause() {}, load() {}, removeAttribute() { this.src=''; },
    play() { this.sources.push(this.src); return new Promise((resolve,reject)=>pending.push({resolve,reject})); } };
  const speech = { cancel() {}, speak(line) { lines.push(line); } };
  const player = createVoicePlayer(button, { media, speech, utterance: text=>({text}), base:'/game/' });
  const item = text => { const classes=new Set();return {text,element:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},classes}}; };
  return {button,lines,pending,media,player,item};
}

test('recorded dialogue uses exact text, queues TTS and recordings, highlights only current paragraph', () => {
  const s=setup(), items=[s.item(passages.muffins),s.item('Delivered. A changing status.'),s.item(passages.food)];
  s.player.read(items);
  assert.match(s.media.src,/^\/game\/audio\/voices\/.*\.mp3$/);
  assert.equal(s.button.textContent,'Stop reading');
  assert.ok(items[0].element.classes.has('reading'));
  s.media.onended();
  assert.equal(s.lines[0].text,items[1].text);
  assert.equal(items[0].element.classes.size,0);
  s.lines[0].onend();
  assert.equal(s.media.sources.length,2);
  assert.ok(items[2].element.classes.has('reading'));
  s.media.onended();
  assert.equal(s.button.textContent,'Read aloud');
  assert.equal(items[2].element.classes.size,0);
});

test('stop cancels pending playback failures and stale TTS completion cannot advance a new session', async () => {
  const s=setup();
  s.player.read([s.item(passages.muffins)]);
  s.player.stop();s.pending[0].reject(new Error('late load failure'));await Promise.resolve();
  assert.equal(s.lines.length,0);
  s.player.read([s.item('Dynamic text'),s.item(passages.food)]);
  const old=s.lines[0];s.player.stop();
  s.player.read([s.item(passages.relay)]);old.onend();
  assert.equal(s.media.sources.length,2);
  assert.equal(s.button.textContent,'Stop reading');
});

test('missing audio falls back only once; denied autoplay requests another gesture', async () => {
  const s=setup();s.player.read([s.item(passages.muffins)]);
  s.media.onerror();s.pending[0].reject(new Error('decode failure'));await Promise.resolve();
  assert.equal(s.lines.length,1);
  s.player.stop();s.player.read([s.item(passages.food)]);
  s.pending[1].reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));await Promise.resolve();
  assert.equal(s.lines.length,1);
  assert.equal(s.button.textContent,'Tap to read aloud');
  assert.equal(s.button.attrs['aria-pressed'],'false');
});

test('all manifest files exist and each core character passage has its intended cast', async () => {
  assert.equal(manifest[passages.muffins].role,'pip');
  assert.equal(manifest[passages.food].role,'luma');
  assert.equal(manifest[passages.relay].role,'narrator');
  for (const clip of Object.values(manifest)) await access(new URL('../public/'+clip.file,import.meta.url));
});
