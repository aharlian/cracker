import { gsap } from 'gsap';
import { qsa, isCoarsePointer, clamp } from '../utils/dom.js';

export function initTilt() {
  if (isCoarsePointer()) return;
  qsa('.tilt-surface').forEach((surface) => {
    const target = surface.querySelector('.book-object') || surface.querySelector('img') || surface;
    surface.addEventListener('pointermove', (event) => {
      const rect = surface.getBoundingClientRect();
      const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      const baseY = target.classList.contains('book-object') ? -20 : 0;
      gsap.to(target, {
        rotateY: baseY + (px - .5) * 12,
        rotateX: (py - .5) * -10,
        x: (px - .5) * 8,
        y: (py - .5) * 8,
        transformPerspective: 1200,
        duration: .65,
        ease: 'power3.out',
      });
      const light = surface.querySelector('.museum-item__light');
      if (light) gsap.to(light, { x: (px - .5) * 100, y: (py - .5) * 65, duration: .45 });
    });
    surface.addEventListener('pointerleave', () => {
      const baseY = target.classList.contains('book-object') ? -20 : 0;
      gsap.to(target, { rotateY: baseY, rotateX: target.classList.contains('book-object') ? 4 : 0, x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1,.35)' });
    });
  });
}
