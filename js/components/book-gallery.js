import { gsap } from 'gsap';
import { qs, qsa } from '../utils/dom.js';

export function initBookGallery() {
  const stage = qs('[data-book-stage]');
  if (!stage) return;
  const cards = qsa('[data-book-card]', stage);
  const previous = qs('[data-book-prev]', stage);
  const next = qs('[data-book-next]', stage);
  const progress = qs('.book-stage__progress span', stage);
  let active = 0;
  let locked = false;

  const show = (index, direction = 1) => {
    if (locked || index === active) return;
    locked = true;
    const outgoing = cards[active];
    const incoming = cards[index];
    const outVisual = qs('.book-card__visual', outgoing);
    const outInfo = qs('.book-card__info', outgoing);
    const inVisual = qs('.book-card__visual', incoming);
    const inInfo = qs('.book-card__info', incoming);

    incoming.classList.add('is-active');
    gsap.set(incoming, { autoAlpha: 1 });
    gsap.timeline({
      defaults: { ease: 'power4.inOut' },
      onComplete: () => {
        outgoing.classList.remove('is-active');
        gsap.set(outgoing, { autoAlpha: 0 });
        active = index;
        locked = false;
      },
    })
      .to(outVisual, { xPercent: -14 * direction, rotateY: -30 * direction, opacity: 0, duration: .65 }, 0)
      .to(outInfo, { y: -22 * direction, opacity: 0, duration: .42 }, 0)
      .fromTo(inVisual, { xPercent: 15 * direction, rotateY: 25 * direction, opacity: 0 }, { xPercent: 0, rotateY: 0, opacity: 1, duration: .9 }, .12)
      .fromTo(inInfo.children, { y: 30 * direction, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .055 }, .28);

    gsap.to(progress, { xPercent: index * 100, duration: .8, ease: 'power4.inOut' });
  };

  const move = (delta) => show((active + delta + cards.length) % cards.length, delta);
  previous?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));

  stage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') move(1);
    if (event.key === 'ArrowLeft') move(-1);
  });
}
