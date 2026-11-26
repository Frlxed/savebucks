// Keep password recovery within the published app. Supabase redirects to this URL
// with a recovery token; auth.js then displays the choose-new-password form.
const APP_URL = 'https://frlxed.github.io/savebucks/';
const style = document.createElement('style');
style.textContent = '.auth-reset-note{margin:0 0 14px;color:#aab4bf;font-size:12px;line-height:1.5}.auth-reset-back{display:block;margin:10px auto 0;padding:4px 8px;border:0;background:none;color:#c4f266;font:inherit;font-size:11px;cursor:pointer}.auth-reset-back:hover{text-decoration:underline}';
document.head.append(style);

// The requested explanatory sentence is removed from all auth states.
function hideAuthDescription() {
  const description = document.querySelector('.auth-description');
  if (description) description.hidden = true;
}
hideAuthDescription();

// Recovery markup is prepared in auth.js after module initialization. Observe
// those updates so recovery never briefly shows normal login/signup controls.
function applyRecoveryPresentation() {
  hideAuthDescription();
  const heading = document.querySelector('#auth-heading');
  if (!heading || !/reset your password|choose a new password/i.test(heading.textContent || '')) return;
  const remember = document.querySelector('.remember-row');
  const forgot = document.querySelector('.auth-forgot');
  if (remember) remember.hidden = true;
  if (forgot) forgot.hidden = true;
}
const recoveryObserver = new MutationObserver(applyRecoveryPresentation);
recoveryObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
applyRecoveryPresentation();

let resetView = null;

document.addEventListener('click', (event) => {
  const forgot = event.target.closest('.auth-forgot');
  if (!forgot) return;
  // Capture before the auth module's click handler can send a duplicate request.
  event.preventDefault();
  event.stopImmediatePropagation();
  const form = document.querySelector('#auth-form');
  if (!form || resetView) return;
  const heading = document.querySelector('#auth-heading');
  const submit = form.querySelector('[type="submit"]');
  const email = form.elements.email;
  const passwordLabel = form.elements.password.closest('label');
  const confirmLabel = form.querySelector('.auth-confirm-password');
  const nameLabel = form.querySelector('.auth-name-field');
  const remember = form.querySelector('.remember-row');
  const hint = form.querySelector('.auth-password-hint');
  const google = document.querySelector('.google-account-button, [data-oauth="google"]');
  const divider = document.querySelector('.auth-divider');
  const switchButton = document.querySelector('#auth-switch');
  const error = document.querySelector('#auth-error');

  const note = document.createElement('p');
  note.className = 'auth-reset-note';
  note.textContent = 'Enter your account email and we’ll send you a secure password-reset link. Open the link in your email to choose a new password.';
  heading.textContent = 'Reset your password';
  submit.textContent = 'Send reset link';
  error.textContent = '';
  passwordLabel.hidden = true;
  if (confirmLabel) confirmLabel.hidden = true;
  if (nameLabel) nameLabel.hidden = true;
  if (remember) remember.hidden = true;
  if (hint) hint.hidden = true;
  if (google) google.hidden = true;
  if (divider) divider.hidden = true;
  if (switchButton) switchButton.hidden = true;
  forgot.hidden = true;
  passwordLabel.before(note);
  form.elements.password.required = false;
  form.elements.password.disabled = true;
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'auth-reset-back';
  back.textContent = 'Back to sign in';
  submit.after(back);

  resetView = { heading, submit, email, passwordLabel, nameLabel, remember, google, divider, switchButton, error, note, back, form };
  back.addEventListener('click', leaveResetView);
  email.focus();
}, true);

function leaveResetView() {
  if (!resetView) return;
  const view = resetView;
  view.heading.textContent = 'Welcome to SaveBucks';
  view.submit.textContent = 'Sign in';
  view.passwordLabel.hidden = false;
  view.form.elements.password.disabled = false;
  view.form.elements.password.required = true;
  if (view.nameLabel) view.nameLabel.hidden = true;
  if (view.remember) view.remember.hidden = false;
  if (view.google) view.google.hidden = false;
  if (view.divider) view.divider.hidden = false;
  if (view.switchButton) view.switchButton.hidden = false;
  view.error.textContent = '';
  view.note.remove();
  view.back.remove();
  resetView = null;
}

document.addEventListener('submit', async (event) => {
  if (!resetView || event.target !== resetView.form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const { email, submit, error } = resetView;
  error.textContent = '';
  const address = String(email.value || '').trim();
  if (!address) { error.textContent = 'Enter your account email to continue.'; email.focus(); return; }
  submit.disabled = true;
  submit.textContent = 'Sending…';
  try {
    const response = await fetch('https://ahxlclpxwkxdnoarlqsx.supabase.co/auth/v1/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: 'sb_publishable_oCJKCAirpKoT20V7K7CdYg_ZAQPsQ5L' },
      body: JSON.stringify({ email: address, redirect_to: APP_URL }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg || result.message || 'Could not send the reset email. Please try again.');
    error.textContent = 'If an account exists for that email, a reset link has been sent. Open it to choose a new password.';
    submit.textContent = 'Reset link sent';
  } catch (issue) {
    error.textContent = issue.message;
    submit.textContent = 'Send reset link';
  } finally {
    submit.disabled = false;
  }
}, true);
