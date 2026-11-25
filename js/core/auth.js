const CONFIG = { url: 'https://ahxlclpxwkxdnoarlqsx.supabase.co', anonKey: 'sb_publishable_oCJKCAirpKoT20V7K7CdYg_ZAQPsQ5L' };
export const isAuthConfigured = () => Boolean(CONFIG.url && CONFIG.anonKey);
const endpoint = (path) => `${CONFIG.url.replace(/\/$/, '')}/auth/v1/${path}`;
const headers = (token) => ({ 'Content-Type': 'application/json', apikey: CONFIG.anonKey, ...(token ? { Authorization: `Bearer ${token}` } : {}) });
const SESSION_KEY = 'savebucks.session';
const REMEMBER_KEY = 'savebucks.remember';

function sessionStorageFor(remember = localStorage.getItem(REMEMBER_KEY) !== 'false') { return remember ? localStorage : sessionStorage; }
function saveSession(session, remember) {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorageFor(remember).setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(REMEMBER_KEY, String(remember));
}
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
async function requestUser(token) {
  const response = await fetch(endpoint('user'), { headers: headers(token) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || 'Could not verify your account session.');
  return data;
}
async function refreshSession(session) {
  if (!session?.refresh_token) return session;
  const response = await fetch(endpoint('token?grant_type=refresh_token'), { method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: session.refresh_token }) });
  if (!response.ok) return null;
  const refreshed = await response.json();
  saveSession(refreshed, localStorage.getItem(REMEMBER_KEY) !== 'false');
  return refreshed;
}
export async function authRequest(path, body, remember = true) {
  const response = await fetch(endpoint(path), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.msg || result.message || result.error_description || result.error || 'Could not authenticate. Please try again.');
  if (result.access_token) saveSession(result, remember);
  else localStorage.setItem(REMEMBER_KEY, String(remember));
  return result;
}
export async function signOut() {
  const session = getSession();
  if (session?.access_token && isAuthConfigured()) await fetch(endpoint('logout'), { method: 'POST', headers: headers(session.access_token) }).catch(() => {});
  localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(REMEMBER_KEY);
}
export function startOAuth(provider, remember = true) {
  if (!isAuthConfigured()) throw new Error('Add your Supabase URL and anon key in js/core/auth.js first.');
  sessionStorage.setItem('savebucks.oauth.remember', String(remember));
  const redirect = `${location.origin}${location.pathname}`;
  location.href = `${endpoint(`authorize?provider=${encodeURIComponent(provider)}`)}&redirect_to=${encodeURIComponent(redirect)}`;
}
export async function readCloudData(userId, token) {
  const response = await fetch(`${CONFIG.url.replace(/\/$/, '')}/rest/v1/user_data?user_id=eq.${encodeURIComponent(userId)}&select=payload`, { headers: headers(token) });
  if (!response.ok) throw new Error('Could not load cloud data. Verify supabase/schema.sql was applied and row-level security is enabled.');
  const rows = await response.json();
  return rows[0]?.payload ?? null;
}

function validPassword(password) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9\s]/.test(password) && !/\s/.test(password);
}

export function mountAuth({ onAuthenticated }) {
  const screen = document.querySelector('#auth-screen');
  const shell = document.querySelector('#app-shell');
  const form = document.querySelector('#auth-form');
  const error = document.querySelector('#auth-error');
  const heading = document.querySelector('#auth-heading');
  const submit = form.querySelector('[type="submit"]');
  const switchButton = document.querySelector('#auth-switch');
  const rememberRow = document.querySelector('.remember-row');
  const rememberInput = form.elements.remember;
  const passwordInput = form.elements.password;
  const passwordLabel = passwordInput.closest('label');
  // New visitors start in create-account mode, matching the first screen in index.html.
  let isSignup = true;
  let isRecovery = false;

  const confirmLabel = document.createElement('label');
  confirmLabel.className = 'auth-confirm-password';
  confirmLabel.textContent = 'Confirm password';
  const confirmInput = document.createElement('input');
  confirmInput.type = 'password';
  confirmInput.name = 'confirmPassword';
  confirmInput.autocomplete = 'new-password';
  confirmInput.required = true;
  confirmInput.placeholder = 'Re-enter your password';
  confirmLabel.append(confirmInput);
  // Insert immediately after password so it is present on the very first page load.
  passwordLabel.after(confirmLabel);

  const passwordHint = document.createElement('span');
  passwordHint.className = 'auth-password-hint';
  passwordHint.textContent = 'At least 8 characters, one uppercase letter and one symbol; no spaces.';
  passwordLabel.append(passwordHint);
  passwordInput.minLength = 8;
  passwordInput.pattern = '(?=.*[A-Z])(?=.*[^A-Za-z0-9\\s])\\S{8,}';
  passwordInput.title = 'Use at least 8 characters, including an uppercase letter and a symbol, with no spaces.';

  rememberRow.hidden = false;
  rememberInput.checked = localStorage.getItem(REMEMBER_KEY) !== 'false';
  form.querySelector('.auth-name-field').hidden = false;
  heading.textContent = 'Create your account';
  submit.textContent = 'Create account';
  switchButton.textContent = 'Already have an account? Sign in';
  passwordInput.autocomplete = 'new-password';

  const forgotButton = document.createElement('button');
  forgotButton.type = 'button';
  forgotButton.className = 'auth-forgot';
  forgotButton.textContent = 'Forgot password?';
  forgotButton.hidden = true;
  confirmLabel.after(forgotButton);
  const authStyle = document.createElement('style');
  authStyle.textContent = '.auth-password-hint{display:block;font-size:9px;color:#89929e;line-height:1.45;margin-top:-3px}.auth-forgot{display:block;margin:-3px 0 10px auto;padding:0;border:0;background:none;color:#c4f266;font:inherit;font-size:10px;cursor:pointer}.auth-forgot:hover{text-decoration:underline}.auth-confirm-password input{display:block;width:100%;margin-top:8px;box-sizing:border-box}';
  document.head.append(authStyle);

  const setBrand = () => {
    document.querySelectorAll('.brand').forEach((brand) => {
      const word = brand.querySelector(':scope > span:last-child');
      if (word) word.innerHTML = 'Save<span class="brand-light">Bucks</span>';
    });
  };
  setBrand();

  const showApp = (session, cloudData) => { screen.hidden = true; shell.hidden = false; onAuthenticated(session, cloudData); };
  async function completeLogin(session) {
    try {
      const fresh = session.expires_at && session.expires_at * 1000 < Date.now() + 30000 ? await refreshSession(session) : session;
      if (!fresh?.access_token) throw new Error('Your session expired. Please sign in again.');
      const user = await requestUser(fresh.access_token);
      const verifiedSession = { ...fresh, user };
      saveSession(verifiedSession, localStorage.getItem(REMEMBER_KEY) !== 'false');
      let cloudData = null;
      try { cloudData = await readCloudData(user.id, fresh.access_token); }
      catch (cloudError) { console.warn('Cloud backup is unavailable; using local data.', cloudError); }
      showApp(verifiedSession, cloudData);
    } catch (issue) {
      localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY);
      screen.hidden = false; shell.hidden = true; error.textContent = issue.message;
    }
  }

  const params = new URLSearchParams(location.hash.slice(1));
  const recoveryLink = params.get('type') === 'recovery';
  const oauthToken = params.get('access_token');
  if (oauthToken) {
    const remember = recoveryLink || sessionStorage.getItem('savebucks.oauth.remember') !== 'false';
    const callbackSession = { access_token: oauthToken, refresh_token: params.get('refresh_token'), expires_at: Number(params.get('expires_at')) || 0 };
    saveSession(callbackSession, remember);
    sessionStorage.removeItem('savebucks.oauth.remember');
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    if (recoveryLink) isRecovery = true;
  }

  function showRecoveryForm() {
    isRecovery = true;
    isSignup = false;
    screen.hidden = false; shell.hidden = true;
    heading.textContent = 'Choose a new password';
    passwordInput.autocomplete = 'new-password';
    passwordHint.hidden = false;
    confirmLabel.hidden = false;
    confirmInput.required = true;
    rememberRow.hidden = true;
    forgotButton.hidden = true;
    switchButton.hidden = true;
    document.querySelector('.google-account-button').hidden = true;
    document.querySelector('.auth-divider').hidden = true;
    form.querySelector('.auth-name-field').hidden = true;
    submit.textContent = 'Update password';
  }

  const session = getSession();
  if (isRecovery && session?.access_token) showRecoveryForm();
  else if (session?.access_token && isAuthConfigured()) {
    screen.hidden = true; shell.hidden = false; completeLogin(session);
  } else {
    screen.hidden = false; shell.hidden = true;
    if (!isAuthConfigured()) document.querySelector('#auth-config-note').hidden = false;
  }

  switchButton.addEventListener('click', () => {
    isSignup = !isSignup;
    heading.textContent = isSignup ? 'Create your account' : 'Welcome to SaveBucks';
    submit.textContent = isSignup ? 'Create account' : 'Sign in';
    switchButton.textContent = isSignup ? 'Already have an account? Sign in' : 'New to SaveBucks? Create an account';
    form.querySelector('.auth-name-field').hidden = !isSignup;
    passwordInput.autocomplete = isSignup ? 'new-password' : 'current-password';
    confirmLabel.hidden = !isSignup;
    confirmInput.required = isSignup;
    passwordHint.hidden = !isSignup;
    forgotButton.hidden = isSignup;
    rememberRow.hidden = false;
    error.textContent = '';
  });

  forgotButton.addEventListener('click', async () => {
    error.textContent = '';
    const email = String(form.elements.email.value || '').trim();
    if (!email) { error.textContent = 'Enter your email address first, then choose Forgot password?'; form.elements.email.focus(); return; }
    forgotButton.disabled = true;
    try {
      const response = await fetch(endpoint('recover'), { method: 'POST', headers: headers(), body: JSON.stringify({ email, redirect_to: `${location.origin}${location.pathname}` }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.msg || result.message || 'Could not send the password reset email.');
      error.textContent = 'If an account exists for that email, a password reset link has been sent.';
    } catch (issue) { error.textContent = issue.message; }
    finally { forgotButton.disabled = false; }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    if (!isAuthConfigured()) { error.textContent = 'Authentication is not configured. Check the Supabase project settings.'; return; }
    const password = passwordInput.value;
    if (!validPassword(password)) {
      error.textContent = 'Password must be at least 8 characters, include an uppercase letter and a symbol, and contain no spaces.';
      passwordInput.focus(); return;
    }
    if ((isSignup || isRecovery) && password !== confirmInput.value) {
      error.textContent = 'The passwords do not match.';
      confirmInput.focus(); return;
    }
    submit.disabled = true;
    try {
      if (isRecovery) {
        const activeSession = getSession();
        const response = await fetch(endpoint('user'), { method: 'PUT', headers: headers(activeSession?.access_token), body: JSON.stringify({ password }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.msg || result.message || 'Could not update your password. Request a new reset link and try again.');
        isRecovery = false;
        await completeLogin({ ...activeSession, user: result });
        return;
      }
      const values = new FormData(form);
      const payload = { email: String(values.get('email')).trim(), password };
      const remember = rememberInput.checked;
      localStorage.setItem(REMEMBER_KEY, String(remember));
      const result = isSignup
        ? await authRequest('signup', { ...payload, data: { name: values.get('name') } }, remember)
        : await authRequest('token?grant_type=password', payload, remember);
      if (!result.access_token) { error.textContent = 'Account created. Confirm your email, then sign in.'; return; }
      await completeLogin(result);
    } catch (issue) { error.textContent = issue.message; }
    finally { submit.disabled = false; }
  });

  document.querySelectorAll('[data-oauth]').forEach((button) => button.addEventListener('click', () => {
    error.textContent = '';
    try { startOAuth(button.dataset.oauth, rememberInput.checked); }
    catch (issue) { error.textContent = issue.message; }
  }));
}
