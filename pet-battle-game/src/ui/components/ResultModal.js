import { h } from '@/utils/dom.js';

export function ResultModal() {
  const title = h('h2', { class: 'modal__title' });
  const text = h('p', { class: 'modal__text' });
  const button = h('button', { class: 'btn', type: 'button' }, 'Continue');
  const el = h('div', { class: 'modal', hidden: true }, h('div', { class: 'modal__card' }, title, text, button));

  return {
    el,
    show({ title: t, text: body }, onContinue) {
      title.textContent = t;
      text.textContent = body || '';
      button.onclick = () => {
        el.hidden = true;
        onContinue();
      };
      el.hidden = false;
      button.focus();
    },
  };
}
