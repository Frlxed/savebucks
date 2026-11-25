const CONFIG = {
  // Fill these in from Supabase Project Settings → API before enabling accounts.
  url: '',
  anonKey: '',
};

export const isAuthConfigured = () => Boolean(CONFIG.url && CONFIG.anonKey);
const endpoint = (path) => `${CONFIG.url.replace(/\/$/, '')}/auth/v1/${path}`;
const headers = (token) => ({ 'Content-Type': 'application/json', apikey: CONFIG.anonKey, ...(token ? { Authorization: `Bearer ${token}` } : {}) });
const SESSION_KEY = 'savebucks.session';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

export async function authRequest(path, body) {
  const response = await fetch(endpoint(path), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.msg || result.message || result.error_description || 'Could not authenticate. Please try again.');
  if (result.access_token) localStorage.setItem(SESSION_KEY, JSON.stringify(result));
  return result;
}

export async function signOut() {
  const session = getSession();
  if (session?.access_token && isAuthConfigured()) {
    await fetch(endpoint('logout'), { method: 'POST', headers: headers(session.access_token) }).catch(() => {});
  }
  localStorage.removeItem(SESSION_KEY);
}

export function startOAuth(provider) {
  if (!isAuthConfigured()) throw new Error('Add your Supabase URL and anon key in js/core/auth.js first.');
  const redirect = `${location.origin}${location.pathname}`;
  location.href = `${endpoint(`authorize?provider=${encodeURIComponent(provider)}`)}&redirect_to=${encodeURIComponent(redirect)}`;
}

export async function readCloudData(userId, token) {
  const response = await fetch(`${CONFIG.url.replace(/\/$/, '')}/rest/v1/user_data?user_id=eq.${encodeURIComponent(userId)}&select=payload`, { headers: headers(token) });
  if (!response.ok) throw new Error('Could not load your cloud data. Check the Supabase table and row-level security setup.');
  const rows = await response.json();
  return rows[0]?.payload ?? null;
}

export async function writeCloudData(userId, token, payload) {
  const response = await fetch(`${CONFIG.url.replace(/\/$/, '')}/rest/v1/user_data`, {
    method: 'POST',
    headers: { ...headers(token), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, payload, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error('Could not sync your data to the cloud.');
}

export async function updateAccount({ email, name }) {
  const session = getSession();
  if (!session?.access_token) throw new Error('Please sign in again to update your account.');
  const response = await fetch(endpoint('user'), { method: 'PUT', headers: headers(session.access_token), body: JSON.stringify({ email, data: { name } }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.msg || result.message || 'Could not update your account.');
  const updated = { ...session, user: result };
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}

export function mountAuth({ onAuthenticated }) {
  const screen = document.querySelector('#auth-screen');
  const shell = document.querySelector('#app-shell');
  const form = document.querySelector('#auth-form');
  const error = document.querySelector('#auth-error');
  const heading = document.querySelector('#auth-heading');
  const submit = form.querySelector('[type="submit"]');
  const switchButton = document.querySelector('#auth-switch');
  let isSignup = false;

  function showApp(session, cloudData) {
    screen.hidden = true;
    shell.hidden = false;
    onAuthenticated(session, cloudData);
  }

  const params = new URLSearchParams(location.hash.slice(1));
  const oauthToken = params.get('access_token');
  if (oauthToken) {
    const user = { id: params.get('user_id') || 'oauth-user', email: '', user_metadata: {} };
    const session = { access_token: oauthToken, user };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  }
  const session = getSession();
  if (session?.access_token) {
    screen.hidden = true;
    shell.hidden = false;
    readCloudData(session.user.id, session.access_token).then((data) => onAuthenticated(session, data)).catch(() => onAuthenticated(session, null));
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
    error.textContent = '';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); error.textContent = '';
    if (!isAuthConfigured()) { error.textContent = 'Authentication is not configured yet. See README.md for the secure setup steps.'; return; }
    submit.disabled = true;
    try {
      const values = new FormData(form);
      const payload = { email: values.get('email'), password: values.get('password') };
      const result = isSignup
        ? await authRequest('signup', { ...payload, data: { name: values.get('name') } })
        : await authRequest('token?grant_type=password', payload);
      if (!result.access_token) { error.textContent = 'Check your email to confirm your account, then sign in.'; return; }
      const cloudData = await readCloudData(result.user.id, result.access_token).catch(() => null);
      showApp(result, cloudData);
    } catch (issue) { error.textContent = issue.message; }
    finally { submit.disabled = false; }
  });

  document.querySelectorAll('[data-oauth]').forEach((button) => button.addEventListener('click', () => {
    error.textContent = '';
    try { startOAuth(button.dataset.oauth); } catch (issue) { error.textContent = issue.message; }
  }));
}
