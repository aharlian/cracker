import { gsap } from 'gsap';
import { qs } from '../utils/dom.js';

const lines = [
  'ACCESSING SECRET ARCHIVE...',
  'VERIFYING IDENTITY...',
  'DECRYPTING FILES...',
  'CLEARANCE LEVEL: OBSIDIAN',
  'WELCOME AGENT.',
];

function typeLine(container, text, speed = 20) {
  return new Promise((resolve) => {
    const row = document.createElement('p');
    container.append(row);
    let index = 0;
    const timer = window.setInterval(() => {
      row.textContent = text.slice(0, index + 1);
      index += 1;
      if (index >= text.length) {
        window.clearInterval(timer);
        resolve(row);
      }
    }, speed);
  });
}

export async function runPreloader() {
  const root = qs('#preloader');
  const terminal = qs('#preloader-terminal');
  const percent = qs('#preloader-percent');
  const bar = qs('#preloader-bar');
  const state = { value: 0 };

  gsap.to(state, {
    value: 100,
    duration: 3.8,
    ease: 'power2.inOut',
    onUpdate: () => {
      const value = Math.round(state.value);
      percent.textContent = `${String(value).padStart(3, '0')}%`;
      bar.style.width = `${value}%`;
    },
  });

  for (let index = 0; index < lines.length; index += 1) {
    const row = await typeLine(terminal, lines[index], index === lines.length - 1 ? 28 : 15);
    if (index === 1 || index === 3) {
      row.classList.add('glitch');
      window.setTimeout(() => row.classList.remove('glitch'), 520);
    }
    await new Promise((resolve) => window.setTimeout(resolve, index === lines.length - 1 ? 360 : 120));
  }

  await new Promise((resolve) => window.setTimeout(resolve, 280));
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .to(root.querySelector('.preloader__content'), { opacity: 0, scale: 1.03, duration: .65, ease: 'power3.in' })
      .to(root, { clipPath: 'inset(0 0 100% 0)', duration: 1.05, ease: 'power4.inOut' }, '-=.2')
      .set(root, { display: 'none' });
  });
}
