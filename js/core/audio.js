import { qs, safePlay } from '../utils/dom.js';

export function initAudio() {
  const audio = qs('#ambient-audio');
  const button = qs('#sound-toggle');
  if (!audio || !button) return;
  audio.volume = .18;

  const sync = (active) => {
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'خاموش‌کردن صدای محیط' : 'فعال‌کردن صدای محیط');
  };

  button.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        await safePlay(audio);
        sync(true);
      } catch {
        sync(false);
      }
    } else {
      audio.pause();
      sync(false);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) {
      audio.dataset.wasPlaying = 'true';
      audio.pause();
    } else if (!document.hidden && audio.dataset.wasPlaying === 'true') {
      safePlay(audio).then(() => sync(true)).catch(() => sync(false));
      delete audio.dataset.wasPlaying;
    }
  });
}
