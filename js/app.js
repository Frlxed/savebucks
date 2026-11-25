import { createStore } from './core/store.js';
import { getSession, mountAuth, readCloudData, signOut, updateAccount, writeCloudData } from './core/auth.js';
import { renderDashboard, mountDashboardControls } from './features/dashboard.js';
import { mountTransactions } from './features/transactions.js';
import { mountIncome } from './features/income.js';
import { mountNavigation } from './features/navigation.js';
import { mountSavings, renderSavings } from './features/savings.js';
import { renderInsights, renderSettings, renderTransactionsWorkspace } from './features/workspaces.js';

const root = document.querySelector('#dashboard-root');
const titles = { overview: 'Overview', transactions: 'Transactions', insights: 'Insights', savings: 'Savings', settings: 'Settings' };
let activeWorkspace = 'overview';
let store;
let account;
let syncTimer;

function render(state) {
  if (!state || !store) return;
  const views = { overview: renderDashboard, transactions: renderTransactionsWorkspace, insights: renderInsights, savings: renderSavings, settings: renderSettings };
  root.innerHTML = (views[activeWorkspace] || renderDashboard)(state);
  document.querySelector('#workspace-title').textContent = titles[activeWorkspace] || 'Overview';
  const name = state.profile?.name || account?.user_metadata?.name || account?.email?.split('@')[0] || 'My workspace';
  const email = account?.email || 'Personal account';
  document.querySelector('#profile-name').textContent = name;
  document.querySelector('#profile-email').textContent = email;
  document.querySelector('#profile-avatar').textContent = name.slice(0, 1).toUpperCase();
  document.querySelector('#top-avatar').textContent = name.slice(0, 1).toUpperCase();
}

function initialize(session, cloudData) {
  account = session.user;
  const userId = account.id;
  const localData = cloudData || undefined;
  store = createStore({ userId, initialState: localData, onChange: (data) => {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => writeCloudData(userId, session.access_token, data).catch((error) => console.warn(error)), 500);
  } });
  render(store.getState());
  store.subscribe(render);
  mountDashboardControls({ root, store });
  mountTransactions({ root, store });
  mountIncome({ store });
  mountSavings({ root, store });
  mountNavigation({ onWorkspaceChange: (workspace) => { activeWorkspace = workspace; render(store.getState()); } });
}

mountAuth({ onAuthenticated: initialize });

document.addEventListener('click', async (event) => {
  if (event.target.closest('[data-logout]')) {
    await signOut();
    location.reload();
    return;
  }
  if (event.target.closest('[data-sidebar-toggle]')) {
    document.body.classList.toggle('sidebar-open');
    document.body.classList.toggle('sidebar-collapsed', !document.body.classList.contains('sidebar-open') && innerWidth > 760);
  }
  if (event.target.closest('[data-close-sidebar]')) document.body.classList.remove('sidebar-open');
  if (event.target.closest('[data-save-settings]')) {
    const form = root.querySelector('[data-settings-form]');
    if (!form) return;
    const values = new FormData(form);
    const name = String(values.get('name') || '').trim();
    const email = String(values.get('email') || '').trim();
    store.setProfile({ name });
    document.documentElement.dataset.theme = values.get('theme') || 'system';
    try {
      if (email !== account.email || name !== account.user_metadata?.name) {
        const updated = await updateAccount({ email, name });
        account = updated.user;
      }
      showToast('Settings saved. Email changes may need confirmation.');
    } catch (error) { showToast(error.message); }
    render(store.getState());
  }
  if (event.target.closest('[data-open-income]')) {
    const incomeInput = document.querySelector('#income-form [name="income"]');
    incomeInput.value = store.getState().incomeByMonth[store.getState().selectedMonth] ?? '';
  }
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-theme-select]')) document.documentElement.dataset.theme = event.target.value;
});

function showToast(message) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.textContent = message;
  document.body.append(toast); setTimeout(() => toast.remove(), 3000);
}

// Restore the chosen appearance without requiring a settings round-trip.
const preferredTheme = localStorage.getItem('savebucks.theme') || 'system';
document.documentElement.dataset.theme = preferredTheme;
document.addEventListener('change', (event) => { if (event.target.matches('[data-theme-select]')) localStorage.setItem('savebucks.theme', event.target.value); });
