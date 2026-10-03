import manifest from './voice-manifest.json' with { type: 'json' };

// One media element and one queue: dialog changes cannot leave stale speech running.
export function createVoicePlayer(button, { media = new Audio(), speech = window.speechSynthesis,
  utterance = text => new SpeechSynthesisUtterance(text), base = import.meta.env.BASE_URL } = {}) {
  media.preload = 'none';
  let session = 0, active = false, highlighted = null;
  function stop() {
    session++; active = false;
    media.onended = media.onerror = null;
    media.pause(); media.removeAttribute('src'); media.load();
    speech?.cancel();
    highlighted?.classList.remove('reading'); highlighted = null;
    button.textContent = 'Read aloud'; button.setAttribute('aria-pressed', 'false');
  }
  function read(items) {
    if (active) { stop(); return; }
    stop(); active = true;
    const token = session;
    button.textContent = 'Stop reading'; button.setAttribute('aria-pressed', 'true');
    function next(index) {
      if (token !== session) return;
      highlighted?.classList.remove('reading'); highlighted = null;
      if (index >= items.length) { stop(); return; }
      const { text, element } = items[index];
      highlighted = element; highlighted?.classList.add('reading');
      let finished = false, fallingBack = false;
      const finish = () => { if (finished || token !== session) return; finished = true; next(index + 1); };
      const fallback = () => {
        if (finished || fallingBack || token !== session) return;
        fallingBack = true;
        media.onended = media.onerror = null; media.pause();
        if (!speech) { finish(); return; }
        const line = utterance(text); line.rate = .95;
        line.onend = line.onerror = finish;
        speech.speak(line);
      };
      const clip = manifest[text];
      if (!clip) { fallback(); return; }
      media.onended = finish; media.onerror = fallback;
      media.src = base + clip.file;
      // Called directly from the Read aloud gesture for the first paragraph.
      media.play().catch(error => {
        if (token !== session || finished) return;
        if (error.name === 'NotAllowedError') { stop(); button.textContent = 'Tap to read aloud'; }
        else fallback();
      });
    }
    next(0);
  }
  return { read, stop };
}
