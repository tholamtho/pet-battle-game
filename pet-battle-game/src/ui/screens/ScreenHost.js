import { h } from '@/utils/dom.js';

/** Full-screen overlay for non-battle screens (login, menu, matchmaking). */
export class ScreenHost {
  constructor(container) {
    this.el = h('div', { class: 'screens', hidden: true });
    container.append(this.el);
  }

  show(content) {
    this.el.replaceChildren(content);
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
    this.el.replaceChildren();
  }
}
