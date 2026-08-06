import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from '../utils/dom.js';

gsap.registerPlugin(ScrollTrigger);

export function createSmoothScroll() {
  if (reducedMotion()) {
    return {
      scrollTo: (target) => document.querySelector(target)?.scrollIntoView({ behavior: 'auto' }),
      start: () => {},
      stop: () => {},
      destroy: () => {},
    };
  }

  const lenis = new Lenis({
    duration: 1.12,
    smoothWheel: true,
    wheelMultiplier: .85,
    touchMultiplier: 1.1,
    syncTouch: false,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
