import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { runPreloader } from './core/preloader.js';
import { createSmoothScroll } from './core/smooth-scroll.js';
import { initCursor } from './core/cursor.js';
import { initAudio } from './core/audio.js';
import { initEntranceAnimations } from './core/scroll-animations.js';
import { initNavigation } from './components/navigation.js';
import { initTilt } from './components/tilt.js';
import { initBookGallery } from './components/book-gallery.js';
import { initTimeline } from './components/timeline.js';
import { initAccessForm } from './components/form.js';
import { createCinematicScene } from './three/scene.js';
import { qs } from './utils/dom.js';

gsap.registerPlugin(ScrollTrigger);

async function bootstrap() {
  window.clearTimeout(window.__ufoSafetyTimeout);
  const shell = qs('#site-shell');
  const canvasHost = qs('#hero-webgl');
  const smoothScroll = createSmoothScroll();
  smoothScroll.stop?.();

  let cinematic = null;
  try {
    cinematic = createCinematicScene(canvasHost);
  } catch (error) {
    console.warn('WebGL scene fallback activated.', error);
    canvasHost.hidden = true;
  }

  const sceneReady = cinematic?.ready || Promise.resolve(false);
  await Promise.allSettled([sceneReady, runPreloader()]);

  gsap.set(shell, { opacity: 1 });
  initEntranceAnimations();
  initNavigation(smoothScroll);
  initCursor();
  initAudio();
  initTilt();
  initBookGallery();
  initTimeline();
  initAccessForm();

  smoothScroll.start?.();
  ScrollTrigger.refresh();

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

bootstrap().catch((error) => {
  console.error(error);
  document.querySelector('#preloader')?.remove();
  gsap.set('#site-shell', { opacity: 1 });
});
