import { h } from '@/utils/dom.js';

export function AuthScreen({ online, onLogin, onRegister, onOffline }) {
  const user = h('input', { class: 'field', placeholder: 'Username', autocomplete: 'username', maxlength: 20 });
  const pass = h('input', { class: 'field', type: 'password', placeholder: 'Password (8+ characters)', autocomplete: 'current-password' });
  const error = h('p', { class: 'screen__error', role: 'alert' });
  const loginBtn = h('button', { class: 'btn', type: 'submit' }, 'Log in');
  const registerBtn = h('button', { class: 'btn btn--ghost', type: 'button' }, 'Create account');
  const offlineBtn = h('button', { class: 'btn btn--ghost', type: 'button', onClick: onOffline }, 'Practice offline');
  const buttons = [loginBtn, registerBtn, offlineBtn];

  async function run(fn) {
    error.textContent = '';
    buttons.forEach((b) => (b.disabled = true));
    try {
      await fn(user.value.trim(), pass.value);
    } catch (err) {
      error.textContent = err.message;
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  }
  registerBtn.onclick = () => run(onRegister);

  const el = online
    ? h('form', { class: 'screen__card', onSubmit: (e) => (e.preventDefault(), run(onLogin)) },
        h('h1', { class: 'screen__title' }, 'Pet Battle'), user, pass, error, loginBtn, registerBtn, offlineBtn)
    : h('div', { class: 'screen__card' },
        h('h1', { class: 'screen__title' }, 'Pet Battle'),
        h('p', { class: 'screen__sub' }, 'Online play is not configured (set VITE_API_URL).'), offlineBtn);
  return { el };
}
