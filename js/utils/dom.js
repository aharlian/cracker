export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const lerp = (a, b, t) => a + (b - a) * t;
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

export function debounce(fn, delay = 150) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), delay);
  };
}

export function splitCharacters(element) {
  if (!element || element.dataset.splitReady) return [];
  const text = element.textContent;
  element.textContent = '';
  element.setAttribute('aria-label', text.trim());
  const chars = [...text].map((character) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = character === ' ' ? '\u00A0' : character;
    element.append(span);
    return span;
  });
  element.dataset.splitReady = 'true';
  return chars;
}

export function splitWords(element) {
  if (!element || element.dataset.wordsReady) return [];
  const text = element.textContent.trim();
  element.textContent = '';
  element.setAttribute('aria-label', text);
  const words = text.split(/\s+/).map((word, index, all) => {
    const outer = document.createElement('span');
    outer.className = 'word';
    outer.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.className = 'word-inner';
    inner.textContent = word;
    outer.append(inner);
    element.append(outer);
    if (index < all.length - 1) element.append(document.createTextNode(' '));
    return inner;
  });
  element.dataset.wordsReady = 'true';
  return words;
}

export function safePlay(media) {
  if (!media) return Promise.reject(new Error('Media element unavailable.'));
  const attempt = media.play();
  return attempt instanceof Promise ? attempt : Promise.resolve();
}
