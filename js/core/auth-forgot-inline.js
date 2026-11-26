// Inline forgot-password flow. The email link carries the one-time recovery token;
// auth.js recognizes it and presents the secure new-password form on this same page.
const STYLE = '.auth-reset-note{margin:0 0 14px;color:#aab4bf;font-size:12px;line-height:1.5}.auth-reset-back{display:block;margin:10px auto 0;padding:4px 8px;border:0;background:none;color:#c4f266;font:inherit;font-size:11px;cursor:pointer}.auth-reset-back:hover{text-decoration:underline}';
const style = document.createElement('style');
style.textContent = STYLE;
document.head.append(style);

let resetView = null;

document.addEventListener('click', (event) => {
  const forgot = event.target.closest('.auth-forgot');
  if (!forgot) return;
  // Prevent the auth module's direct click handler from sending the request
  // before the inline reset view has collected/validated the email.
  event.preventDefault();
  event.stopImmediatePropagation();
  const form = document.querySelector('#auth-form');
  if (!form || resetView) return;
  const screen = document.querySelector('#auth-screen');
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
  note.textContent = 'Enter your account email and we’ll send you a secure password-reset link. You can set your new password on this page after opening the link.';
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
  passwordLabel.before(note);
  form.elements.password.required = false;
  form.elements.password.disabled = true;
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'auth-reset-back';
  back.textContent = 'Back to sign in';
  submit.after(back);

  resetView = { screen, heading, submit, email, passwordLabel, confirmLabel, nameLabel, remember, hint, google, divider, switchButton, error, note, back, form };
  back.addEventListener('click', leaveResetView);
  email.focus();
});

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
      body: JSON.stringify({ email: address, redirect_to: `${location.origin}${location.pathname}` }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg || result.message || 'Could not send the reset email. Please try again.');
    error.textContent = 'If an account exists for that email, a reset link has been sent. Open it to choose a new password here.';
    submit.textContent = 'Reset link sent';
  } catch (issue) {
    error.textContent = issue.message;
    submit.textContent = 'Send reset link';
  } finally {
    submit.disabled = false;
  }
}, true);

// Keep the helper referenced for the reset screen's Back button listener.
void leaveResetView;
