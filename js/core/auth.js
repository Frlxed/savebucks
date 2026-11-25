import { CURRENCIES } from './currency.js';

const CONFIG = { url: 'https://ahxlclpxwkxdnoarlqsx.supabase.co', anonKey: 'PASTE_YOUR_ANON_OR_PUBLISHABLE_KEY_HERE' };
export const isAuthConfigured = () => Boolean(CONFIG.url && CONFIG.anonKey);
const endpoint = (path) => `${CONFIG.url.replace(/\/$/, '')}/auth/v1/${path}`;
const headers = (token) => ({ 'Content-Type': 'application/json', apikey: CONFIG.anonKey, ...(token ? { Authorization: `Bearer ${token}` } : {}) });
const SESSION_KEY = 'savebucks.session';
const REMEMBER_KEY = 'savebucks.remember';

function sessionStorageFor(remember = localStorage.getItem(REMEMBER_KEY) !== 'false') { return remember ? localStorage : sessionStorage; }
function saveSession(session, remember) {
  localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY);
  sessionStorageFor(remember).setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(REMEMBER_KEY, String(remember));
}
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
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
  const refreshed = await response.json(); saveSession(refreshed, localStorage.getItem(REMEMBER_KEY) !== 'false'); return refreshed;
}
export async function authRequest(path, body, remember = true) {
  const response = await fetch(endpoint(path), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.msg || result.message || result.error_description || result.error || 'Could not authenticate. Please try again.');
  if (result.access_token) saveSession(result, remember);
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
  const rows = await response.json(); return rows[0]?.payload ?? null;
}
export async function writeCloudData(userId, token, payload) {
  const url = `${CONFIG.url.replace(/\/$/, '')}/rest/v1/user_data?on_conflict=user_id`;
  const response = await fetch(url, { method: 'POST', headers: { ...headers(token), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: userId, payload, updated_at: new Date().toISOString() }) });
  if (!response.ok) throw new Error('Could not back up your data to Supabase.');
}
export async function updateAccount({ email, name }) {
  const session = getSession(); if (!session?.access_token) throw new Error('Please sign in again to update your account.');
  const response = await fetch(endpoint('user'), { method: 'PUT', headers: headers(session.access_token), body: JSON.stringify({ email, data: { name } }) });
  const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.msg || result.message || 'Could not update your account.');
  const updated = { ...session, user: result }; saveSession(updated, localStorage.getItem(REMEMBER_KEY) !== 'false'); return updated;
}

export function mountAuth({ onAuthenticated }) {
  const screen = document.querySelector('#auth-screen'); const shell = document.querySelector('#app-shell');
  const form = document.querySelector('#auth-form'); const error = document.querySelector('#auth-error');
  const heading = document.querySelector('#auth-heading'); const submit = form.querySelector('[type="submit"]');
  const switchButton = document.querySelector('#auth-switch'); let isSignup = false;
  const rememberInput = form.elements.remember;
  const showApp = (session, cloudData) => { screen.hidden = true; shell.hidden = false; onAuthenticated(session, cloudData); };

  async function completeLogin(session) {
    try {
      const fresh = session.expires_at && session.expires_at * 1000 < Date.now() + 30000 ? await refreshSession(session) : session;
      if (!fresh?.access_token) throw new Error('Your session expired. Please sign in again.');
      const user = await requestUser(fresh.access_token); const verifiedSession = { ...fresh, user };
      saveSession(verifiedSession, localStorage.getItem(REMEMBER_KEY) !== 'false');
      const data = await readCloudData(user.id, fresh.access_token);
      showApp(verifiedSession, data);
    } catch (issue) {
      localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY);
      screen.hidden = false; shell.hidden = true;
      error.textContent = `${issue.message} Your sign-in is still available; please try again.`;
    }
  }

  const params = new URLSearchParams(location.hash.slice(1));
  const oauthToken = params.get('access_token');
  if (oauthToken) {
    const remember = sessionStorage.getItem('savebucks.oauth.remember') !== 'false';
    saveSession({ access_token: oauthToken, refresh_token: params.get('refresh_token'), expires_at: Number(params.get('expires_at')) || 0 }, remember);
    sessionStorage.removeItem('savebucks.oauth.remember'); history.replaceState(null, '', `${location.pathname}${location.search}`);
  }
  const session = getSession();
  if (session?.access_token && isAuthConfigured()) { screen.hidden = true; shell.hidden = false; completeLogin(session); }
  else {
    screen.hidden = false; shell.hidden = true;
    if (!isAuthConfigured()) document.querySelector('#auth-config-note').hidden = false;
  }

  switchButton.addEventListener('click', () => {
    isSignup = !isSignup; heading.textContent = isSignup ? 'Create your account' : 'Welcome to SaveBucks';
    submit.textContent = isSignup ? 'Create account' : 'Sign in';
    switchButton.textContent = isSignup ? 'Already have an account? Sign in' : 'New to SaveBucks? Create an account';
    form.querySelector('.auth-name-field').hidden = !isSignup; form.elements.password.autocomplete = isSignup ? 'new-password' : 'current-password';
    document.querySelector('.remember-row').hidden = !isSignup; error.textContent = '';
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); error.textContent = '';
    if (!isAuthConfigured()) { error.textContent = 'Authentication is not configured yet. Add your Supabase project settings; see README.md.'; return; }
    submit.disabled = true;
    try {
      const values = new FormData(form); const payload = { email: values.get('email'), password: values.get('password') };
      const remember = Boolean(values.get('remember'));
      const result = isSignup ? await authRequest('signup', { ...payload, data: { name: values.get('name') } }, remember) : await authRequest('token?grant_type=password', payload, remember);
      if (!result.access_token) { error.textContent = 'Account created. Confirm your email, then sign in.'; return; }
      await completeLogin(result);
    } catch (issue) { error.textContent = issue.message; }
    finally { submit.disabled = false; }
  });
  document.querySelectorAll('[data-oauth]').forEach((button) => button.addEventListener('click', () => {
    error.textContent = ''; try { startOAuth(button.dataset.oauth, Boolean(rememberInput.checked)); } catch (issue) { error.textContent = issue.message; }
  }));
}
