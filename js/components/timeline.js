import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { qs, qsa, reducedMotion, debounce } from '../utils/dom.js';

gsap.registerPlugin(ScrollTrigger);

export function initTimeline() {
  const section = qs('#timeline');
  const track = qs('[data-timeline-track]');
  if (!section || !track || reducedMotion()) return;
  let tween;

  const build = () => {
    tween?.scrollTrigger?.kill();
    tween?.kill();
    gsap.set(track, { x: 0 });
    const distance = Math.max(0, track.scrollWidth - window.innerWidth);
    tween = gsap.to(track, {
      x: -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance + window.innerHeight * .7}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set('.timeline-line span', { width: `${self.progress * 100}%` }),
      },
    });

    qsa('[data-era]', track).forEach((card) => {
      gsap.fromTo(card, { opacity: .28 }, {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          containerAnimation: tween,
          start: 'left 80%',
          end: 'right 30%',
          scrub: true,
        },
      });
    });
  };

  build();
  window.addEventListener('resize', debounce(() => {
    build();
    ScrollTrigger.refresh();
  }, 250));
}
