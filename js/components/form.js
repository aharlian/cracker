import { qs } from '../utils/dom.js';

export function initAccessForm() {
  const form = qs('#access-form');
  if (!form) return;
  const input = qs('#agent-contact', form);
  const status = qs('#form-status', form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPhone = /^[+\d][\d\s()-]{7,}$/.test(value);
    if (!isEmail && !isPhone) {
      status.textContent = 'یک ایمیل یا شماره تماس معتبر وارد کنید.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    form.classList.add('is-success');
    status.textContent = 'درخواست ثبت شد. کد دسترسی پس از تأیید آرشیو ارسال می‌شود.';
    input.value = '';
  });
}
