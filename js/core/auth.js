const CONFIG = { url: 'https://ahxlclpxwkxdnoarlqsx.supabase.co', anonKey: 'sb_publishable_oCJKCAirpKoT20V7K7CdYg_ZAQPsQ5L' };
export const isAuthConfigured = () => Boolean(CONFIG.url && CONFIG.anonKey);
const endpoint = (path) => `${CONFIG.url.replace(/\/$/, '')}/auth/v1/${path}`;
const headers = (token) => ({ 'Content-Type': 'application/json', apikey: CONFIG.anonKey, ...(token ? { Authorization: `Bearer ${token}` } : {}) });
const SESSION_KEY = 'savebucks.session';
const REMEMBER_KEY = 'savebucks.remember';

function sessionStorageFor(remember = localStorage.getItem(REMEMBER_KEY) !== 'false') {
  return remember ? localStorage : sessionStorage;
}
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
  const response = await fetch(endpoint('token?grant_type=refresh_token'), {
    method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
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
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
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
export async function writeCloudData(userId, token, payload) {
  const url = `${CONFIG.url.replace(/\/$/, '')}/rest/v1/user_data?on_conflict=user_id`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...headers(token), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, payload, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error('Could not back up your data to Supabase.');
}
export async function updateAccount({ email, name }) {
  const session = getSession();
  if (!session?.access_token) throw new Error('Please sign in again to update your account.');
  const response = await fetch(endpoint('user'), {
    method: 'PUT', headers: headers(session.access_token), body: JSON.stringify({ email, data: { name } }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.msg || result.message || 'Could not update your account.');
  const updated = { ...session, user: result };
  saveSession(updated, localStorage.getItem(REMEMBER_KEY) !== 'false');
  return updated;
}

function setBrandCapitalization() {
  document.querySelectorAll('.brand').forEach((brand) => {
    const word = brand.querySelector(':scope > span:last-child');
    if (word) word.innerHTML = 'Save<span class="brand-light">Bucks</span>';
  });
  const mobileBrand = document.querySelector('.mobile-brand');
  if (mobileBrand) {
    [...mobileBrand.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).forEach((node) => node.remove());
    mobileBrand.insertAdjacentHTML('beforeend', ' Save<span class="brand-light">Bucks</span>');
  }
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
  let isSignup = false;

  // Keep the remember choice visible for both flows and default to staying signed in.
  rememberRow.hidden = false;
  rememberInput.checked = localStorage.getItem(REMEMBER_KEY) !== 'false';
  form.elements.password.minLength = 8;
  form.elements.password.pattern = '(?=.*[A-Z])(?=.*[^A-Za-z0-9\\s])\\S{8,}';
  form.elements.password.title = 'Use at least 8 characters, including an uppercase letter and a symbol, with no spaces.';
  const passwordHint = document.createElement('span');
  passwordHint.className = 'auth-password-hint';
  passwordHint.textContent = 'At least 8 characters, one uppercase letter and one symbol; no spaces.';
  form.elements.password.closest('label').append(passwordHint);
  const hintStyle = document.createElement('style');
  hintStyle.textContent = '.auth-password-hint{font-size:9px;color:#89929e;line-height:1.45;margin-top:-3px}.auth-card .remember-row{display:flex;align-items:center;gap:9px}.auth-card .remember-row input{width:15px;height:15px;accent-color:#c4f266}';
  document.head.append(hintStyle);
  setBrandCapitalization();

  const showApp = (session, cloudData) => {
    screen.hidden = true;
    shell.hidden = false;
    onAuthenticated(session, cloudData);
  };

  async function completeLogin(session) {
    try {
      const fresh = session.expires_at && session.expires_at * 1000 < Date.now() + 30000 ? await refreshSession(session) : session;
      if (!fresh?.access_token) throw new Error('Your session expired. Please sign in again.');
      const user = await requestUser(fresh.access_token);
      const verifiedSession = { ...fresh, user };
      const remember = localStorage.getItem(REMEMBER_KEY) !== 'false';
      saveSession(verifiedSession, remember);

      // Cloud backup/table setup must not block a valid account from logging in.
      let cloudData = null;
      try { cloudData = await readCloudData(user.id, fresh.access_token); }
      catch (cloudError) { console.warn('SaveBucks cloud backup is unavailable; using this account’s local backup.', cloudError); }
      showApp(verifiedSession, cloudData);
    } catch (issue) {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      screen.hidden = false;
      shell.hidden = true;
      error.textContent = issue.message;
    }
  }

  const params = new URLSearchParams(location.hash.slice(1));
  const oauthToken = params.get('access_token');
  if (oauthToken) {
    const remember = sessionStorage.getItem('savebucks.oauth.remember') !== 'false';
    saveSession({ access_token: oauthToken, refresh_token: params.get('refresh_token'), expires_at: Number(params.get('expires_at')) || 0 }, remember);
    sessionStorage.removeItem('savebucks.oauth.remember');
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  }

  const session = getSession();
  if (session?.access_token && isAuthConfigured()) {
    screen.hidden = true;
    shell.hidden = false;
    completeLogin(session);
  } else {
    screen.hidden = false;
    shell.hidden = true;
    if (!isAuthConfigured()) document.querySelector('#auth-config-note').hidden = false;
  }

  switchButton.addEventListener('click', () => {
    isSignup = !isSignup;
    heading.textContent = isSignup ? 'Create your account' : 'Welcome to SaveBucks';
    submit.textContent = isSignup ? 'Create account' : 'Sign in';
    switchButton.textContent = isSignup ? 'Already have an account? Sign in' : 'New to SaveBucks? Create an account';
    form.querySelector('.auth-name-field').hidden = !isSignup;
    form.elements.password.autocomplete = isSignup ? 'new-password' : 'current-password';
    // Sign-in uses Supabase password-grant only; it cannot silently register a new user.
    error.textContent = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    if (!isAuthConfigured()) { error.textContent = 'Authentication is not configured. Check the Supabase project settings.'; return; }
    const password = form.elements.password.value;
    if (!validPassword(password)) {
      error.textContent = 'Password must be at least 8 characters, include an uppercase letter and a symbol, and contain no spaces.';
      form.elements.password.focus();
      return;
    }

    submit.disabled = true;
    try {
      const values = new FormData(form);
      const payload = { email: String(values.get('email')).trim(), password };
      const remember = rememberInput.checked;
      localStorage.setItem(REMEMBER_KEY, String(remember));
      // Signup is only called from the explicit create-account mode. Login only
      // requests a password token, so accounts that do not exist cannot log in.
      const result = isSignup
        ? await authRequest('signup', { ...payload, data: { name: values.get('name') } }, remember)
        : await authRequest('token?grant_type=password', payload, remember);
      if (!result.access_token) {
        error.textContent = 'Account created. Confirm your email, then sign in with your new account.';
        return;
      }
      await completeLogin(result);
    } catch (issue) {
      error.textContent = issue.message;
    } finally {
      submit.disabled = false;
    }
  });

  document.querySelectorAll('[data-oauth]').forEach((button) => button.addEventListener('click', () => {
    error.textContent = '';
    try { startOAuth(button.dataset.oauth, rememberInput.checked); }
    catch (issue) { error.textContent = issue.message; }
  }));
}
