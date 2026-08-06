import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { qs, qsa } from '../utils/dom.js';

gsap.registerPlugin(ScrollTrigger);

export function initNavigation(lenis) {
  const header = qs('#site-header');
  const toggle = qs('#menu-toggle');
  const menu = qs('#mobile-menu');
  const links = qsa('a[href^="#"]');
  let menuOpen = false;

  const closeMenu = () => {
    if (!menuOpen) return;
    menuOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'بازکردن منو');
    menu.setAttribute('aria-hidden', 'true');
    lenis?.start?.();
    gsap.to(menu, { autoAlpha: 0, duration: .45, ease: 'power3.inOut' });
  };

  toggle?.addEventListener('click', () => {
    menuOpen = !menuOpen;
    toggle.setAttribute('aria-expanded', String(menuOpen));
    toggle.setAttribute('aria-label', menuOpen ? 'بستن منو' : 'بازکردن منو');
    menu.setAttribute('aria-hidden', String(!menuOpen));
    menuOpen ? lenis?.stop?.() : lenis?.start?.();
    gsap.to(menu, { autoAlpha: menuOpen ? 1 : 0, duration: .6, ease: 'power3.inOut' });
    gsap.fromTo(menu.querySelectorAll('nav a'), { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .06, ease: 'power3.out', delay: menuOpen ? .15 : 0 });
  });

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = link.getAttribute('href');
      if (!target || target === '#') return;
      const node = document.querySelector(target);
      if (!node) return;
      event.preventDefault();
      closeMenu();
      lenis?.scrollTo ? lenis.scrollTo(node, { offset: -40, duration: 1.15 }) : node.scrollIntoView({ behavior: 'smooth' });
    });
  });

  ScrollTrigger.create({
    start: 70,
    onUpdate: (self) => header.classList.toggle('is-scrolled', self.scroll() > 70),
  });

  qsa('[data-nav]').forEach((link) => {
    const target = qs(link.getAttribute('href'));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: ({ isActive }) => link.classList.toggle('is-active', isActive),
    });
  });
}
