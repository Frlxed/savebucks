// Standalone forgot-password screen for the existing auth card. The recovery
// email returns to the published app URL with Supabase's recovery token in the
// URL fragment; auth.js consumes that token and shows its password-reset form.
const SUPABASE_URL = 'https://ahxlclpxwkxdnoarlqsx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oCJKCAirpKoT20V7K7CdYg_ZAQPsQ5L';
const APP_URL = 'https://frlxed.github.io/savebucks/';

// Remove the auth-card subtitle requested by the app owner.
document.querySelector('.auth-description')?.remove();

const style = document.createElement('style');
style.textContent = '.auth-reset-note{margin:0 0 14px;color:#aab4bf;font-size:12px;line-height:1.5}.auth-reset-back{display:block;margin:10px auto 0;padding:4px 8px;border:0;background:none;color:#c4f266;font:inherit;font-size:11px;cursor:pointer}.auth-reset-back:hover{text-decoration:underline}#auth-screen .remember-row[hidden]{display:none!important}';
document.head.append(style);

let resetView = null;

// Intercept the auth module's Forgot password button and switch the auth card
// to a dedicated email-entry view rather than sending immediately.
document.addEventListener('click', (event) => {
  const forgot = event.target.closest('.auth-forgot');
  if (!forgot) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const form = document.querySelector('#auth-form');
  if (!form || resetView) return;
  const heading = document.querySelector('#auth-heading');
  const submit = form.querySelector('[type="submit"]');
  const email = form.elements.email;
  const password = form.elements.password;
  const passwordLabel = password.closest('label');
  const confirmLabel = form.querySelector('.auth-confirm-password');
  const nameLabel = form.querySelector('.auth-name-field');
  const remember = form.querySelector('.remember-row');
  const passwordHint = form.querySelector('.auth-password-hint');
  const google = document.querySelector('.google-account-button');
  const divider = document.querySelector('.auth-divider');
  const switchButton = document.querySelector('#auth-switch');
  const error = document.querySelector('#auth-error');

  const previous = {
    heading: heading.textContent,
    submit: submit.textContent,
    passwordRequired: password.required,
    passwordDisabled: password.disabled,
    nameHidden: nameLabel?.hidden,
    rememberHidden: remember?.hidden,
    googleHidden: google?.hidden,
    dividerHidden: divider?.hidden,
    switchHidden: switchButton?.hidden,
    forgotHidden: forgot.hidden,
  };
  const note = document.createElement('p');
  note.className = 'auth-reset-note';
  note.textContent = 'Enter your email address and we’ll send you a link to reset your password.';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'auth-reset-back';
  back.textContent = 'Back to sign in';

  heading.textContent = 'Forgot password';
  submit.textContent = 'Send reset link';
  error.textContent = '';
  passwordLabel.hidden = true;
  if (confirmLabel) confirmLabel.hidden = true;
  if (nameLabel) nameLabel.hidden = true;
  if (remember) remember.hidden = true;
  if (passwordHint) passwordHint.hidden = true;
  if (google) google.hidden = true;
  if (divider) divider.hidden = true;
  if (switchButton) switchButton.hidden = true;
  forgot.hidden = true;
  password.required = false;
  password.disabled = true;
  passwordLabel.before(note);
  submit.after(back);

  resetView = { form, heading, submit, email, password, passwordLabel, confirmLabel, nameLabel, remember, passwordHint, google, divider, switchButton, forgot, error, note, back, previous };
  back.addEventListener('click', leaveResetView);
  email.focus();
}, true);

function leaveResetView() {
  if (!resetView) return;
  const view = resetView;
  const previous = view.previous;
  view.heading.textContent = previous.heading;
  view.submit.textContent = previous.submit;
  view.passwordLabel.hidden = false;
  view.password.required = previous.passwordRequired;
  view.password.disabled = previous.passwordDisabled;
  if (view.confirmLabel) view.confirmLabel.hidden = true;
  if (view.nameLabel) view.nameLabel.hidden = previous.nameHidden;
  if (view.remember) view.remember.hidden = previous.rememberHidden;
  if (view.passwordHint) view.passwordHint.hidden = true;
  if (view.google) view.google.hidden = previous.googleHidden;
  if (view.divider) view.divider.hidden = previous.dividerHidden;
  if (view.switchButton) view.switchButton.hidden = previous.switchHidden;
  if (view.forgot) view.forgot.hidden = previous.forgotHidden;
  view.error.textContent = '';
  view.note.remove();
  view.back.remove();
  resetView = null;
}

// Capture submit ahead of auth.js. In this view, only the email field is
// enabled/required and the form sends a Supabase recovery email.
document.addEventListener('submit', async (event) => {
  if (!resetView || event.target !== resetView.form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const { email, submit, error } = resetView;
  error.textContent = '';
  const address = String(email.value || '').trim();
  if (!address) {
    error.textContent = 'Enter your email address first.';
    email.focus();
    return;
  }
  submit.disabled = true;
  submit.textContent = 'Sending…';
  try {
    // Supabase Auth expects redirect_to as a query parameter for /recover;
    // sending it in the JSON body is ignored and falls back to the Site URL.
    const recoverUrl = new URL(`${SUPABASE_URL}/auth/v1/recover`);
    recoverUrl.searchParams.set('redirect_to', APP_URL);
    const response = await fetch(recoverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email: address }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg || result.message || result.error_description || 'Could not send the reset email. Please try again.');
    error.textContent = 'If an account exists for that email, a reset link has been sent. Open it to set a new password.';
    submit.textContent = 'Reset link sent';
  } catch (issue) {
    error.textContent = issue.message;
    submit.textContent = 'Send reset link';
  } finally {
    submit.disabled = false;
  }
}, true);
