import { gsap } from 'gsap';
import { qsa, qs, isCoarsePointer } from '../utils/dom.js';

export function initCursor() {
  if (isCoarsePointer()) return () => {};
  const cursor = qs('#cursor');
  const mouseGlow = qs('#mouse-glow');
  const position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const rendered = { x: position.x, y: position.y };

  const render = () => {
    rendered.x += (position.x - rendered.x) * .18;
    rendered.y += (position.y - rendered.y) * .18;
    gsap.set(cursor, { x: rendered.x - 22, y: rendered.y - 22 });
    if (mouseGlow) gsap.set(mouseGlow, { x: rendered.x, y: rendered.y });
    requestAnimationFrame(render);
  };

  const onMove = (event) => {
    position.x = event.clientX;
    position.y = event.clientY;
    if (!cursor.style.opacity) gsap.to(cursor, { opacity: 1, duration: .3 });
  };
  const onDown = () => cursor.classList.add('is-click');
  const onUp = () => cursor.classList.remove('is-click');

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });

  qsa('a, button, input, [tabindex="0"], .tilt-surface').forEach((element) => {
    element.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
    element.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
  });

  qsa('.magnetic').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      gsap.to(element, { x: x * .18, y: y * .22, duration: .5, ease: 'power3.out' });
    });
    element.addEventListener('pointerleave', () => gsap.to(element, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.35)' }));
  });

  render();
  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
  };
}
