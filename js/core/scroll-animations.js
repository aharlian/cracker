import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { qsa, qs, splitCharacters, splitWords, reducedMotion } from '../utils/dom.js';

gsap.registerPlugin(ScrollTrigger);

export function initEntranceAnimations() {
  const minimal = reducedMotion();

  const heroChars = splitCharacters(qs('[data-split]'));
  qsa('[data-split-fa]').forEach((title) => splitWords(title));

  if (minimal) {
    gsap.set('.site-shell', { opacity: 1 });
    return;
  }

  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to('.site-shell', { opacity: 1, duration: .2 })
    .from(heroChars, { yPercent: 115, rotateX: -80, opacity: 0, duration: 1.25, stagger: .045 }, .05)
    .from('.hero__title-sub', { y: 20, opacity: 0, letterSpacing: '.9em', duration: 1.1 }, .45)
    .from('.hero__eyebrow', { x: -25, opacity: 0, duration: .8 }, .25)
    .from('.hero__intro', { y: 30, opacity: 0, duration: .85 }, .65)
    .from('.hero__actions > *', { y: 20, opacity: 0, duration: .7, stagger: .1 }, .78)
    .from('.hero__status > div', { y: 15, opacity: 0, duration: .6, stagger: .08 }, .92)
    .from('.scroll-cue', { opacity: 0, duration: .7 }, 1.1);

  qsa('[data-split-fa]').forEach((title) => {
    const words = qsa('.word-inner', title);
    gsap.from(words, {
      yPercent: 115,
      opacity: 0,
      rotateX: -55,
      duration: .95,
      stagger: .055,
      ease: 'power4.out',
      scrollTrigger: { trigger: title, start: 'top 82%', once: true },
    });
  });

  qsa('.reveal-text').forEach((element) => {
    if (element.closest('.hero')) return;
    gsap.from(element, { x: -25, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } });
  });
  qsa('.reveal-copy').forEach((element) => {
    if (element.closest('.hero')) return;
    gsap.from(element, { y: 35, opacity: 0, filter: 'blur(8px)', duration: 1, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } });
  });
  qsa('.reveal-scale').forEach((element) => {
    gsap.from(element, { scale: .8, opacity: 0, rotate: -8, duration: 1.2, ease: 'power4.out', scrollTrigger: { trigger: element, start: 'top 85%', once: true } });
  });

  gsap.to('.seal', { rotate: 14, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
  gsap.from('.book-object', { scale: .72, rotateY: -52, y: 80, opacity: 0, duration: 1.5, ease: 'power4.out', scrollTrigger: { trigger: '#books', start: 'top 62%', once: true } });
  gsap.from('.museum-item', { y: 100, opacity: 0, rotateX: -8, duration: 1.15, stagger: .15, ease: 'power4.out', scrollTrigger: { trigger: '.museum', start: 'top 78%', once: true } });
  gsap.from('.file-card', { y: 120, opacity: 0, rotate: () => gsap.utils.random(-5, 5), duration: 1.15, stagger: .12, ease: 'power4.out', scrollTrigger: { trigger: '.archive-grid', start: 'top 82%', once: true } });

  gsap.to('.hero__content', { yPercent: 22, opacity: .08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
  gsap.to('.hero__grain', { opacity: .28, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}
