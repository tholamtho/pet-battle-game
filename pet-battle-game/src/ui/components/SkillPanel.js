import { h } from '@/utils/dom.js';

export function SkillPanel() {
  const el = h('div', { class: 'skills' });
  let onSelect = () => {};

  function setSkills(skills, handler) {
    onSelect = handler;
    el.replaceChildren(
      ...skills.map((s) =>
        h(
          'button',
          { class: `skill skill--${s.element}`, type: 'button', onClick: () => onSelect(s.id) },
          h('span', { class: 'skill__name' }, s.name),
          h('span', { class: 'skill__meta' }, `${s.element} · pow ${s.power}`),
        ),
      ),
    );
  }

  function setEnabled(enabled) {
    el.querySelectorAll('button').forEach((b) => (b.disabled = !enabled));
  }

  return { el, setSkills, setEnabled };
}
