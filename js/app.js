import { createStore } from './core/store.js';
import { mountAuth, readCloudData, signOut, updateAccount, writeCloudData } from './core/auth.js';
import { renderDashboard, mountDashboardControls } from './features/dashboard.js';
import { mountTransactions } from './features/transactions.js';
import { mountIncome } from './features/income.js';
import { mountNavigation } from './features/navigation.js';
import { renderSavings, mountSavings } from './features/savings.js';
import { renderInsights, renderRecurring, renderSettings, renderTransactionsWorkspace } from './features/workspaces.js';
import { getCurrency } from './core/currency.js';

const root = document.querySelector('#dashboard-root');
const titles = { overview: 'Overview', transactions: 'Transactions', insights: 'Insights', savings: 'Savings', recurring: 'Recurring expenses', settings: 'Settings' };
let activeWorkspace = 'overview'; let store; let account; let syncTimer;

function render(state) {
  if (!state || !store) return;
  const views = { overview: renderDashboard, transactions: renderTransactionsWorkspace, insights: renderInsights, savings: renderSavings, recurring: renderRecurring, settings: renderSettings };
  root.innerHTML = (views[activeWorkspace] || renderDashboard)(state);
  document.querySelector('#workspace-title').textContent = titles[activeWorkspace] || 'Overview';
  const name = state.profile?.name || account?.user_metadata?.name || account?.email?.split('@')[0] || 'My workspace';
  document.querySelector('#profile-name').textContent = name; document.querySelector('#profile-email').textContent = account?.email || 'Personal account';
  document.querySelector('#profile-avatar').textContent = name.slice(0, 1).toUpperCase(); document.querySelector('#top-avatar').textContent = name.slice(0, 1).toUpperCase();
  document.querySelector('#privacy-toggle').setAttribute('aria-pressed', String(document.body.classList.contains('privacy-mode')));
}
function initialize(session, cloudData) {
  account = session.user;
  const userId = account.id;
  store = createStore({ userId, initialState: cloudData || null, onChange: (data) => {
    clearTimeout(syncTimer); syncTimer = setTimeout(() => writeCloudData(userId, session.access_token, data).catch((error) => showToast(`${error.message} Your local backup is safe.`)), 500);
  } });
  render(store.getState()); store.subscribe(render);
  mountDashboardControls({ root, store }); mountTransactions({ root, store }); mountIncome({ store }); mountSavings({ root, store });
  mountNavigation({ onWorkspaceChange: (workspace) => { activeWorkspace = workspace; render(store.getState()); } });
  ensureDueRecurringExpenses(store);
}
function ensureDueRecurringExpenses(activeStore) {
  const now = new Date(); const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  for (const item of activeStore.getState().recurringExpenses || []) {
    const day = Math.min(Number(item.day) || 1, 28);
    if (now.getDate() >= day) activeStore.addRecurringTransaction({ recurringId: item.id, recurringMonth: month, description: item.name, category: item.category, date: `${month}-${String(day).padStart(2, '0')}`, quantity: 1, unitPrice: Number(item.amount) });
  }
}
mountAuth({ onAuthenticated: initialize });

document.addEventListener('click', async (event) => {
  if (event.target.closest('[data-logout]')) { await signOut(); location.reload(); return; }
  if (event.target.closest('[data-sidebar-toggle]')) {
    if (innerWidth <= 760) document.body.classList.toggle('sidebar-open');
    else document.body.classList.toggle('sidebar-collapsed');
  }
  if (event.target.closest('[data-close-sidebar]')) document.body.classList.remove('sidebar-open');
  if (event.target.closest('[data-privacy-toggle]')) {
    document.body.classList.toggle('privacy-mode');
    localStorage.setItem('savebucks.privacy', String(document.body.classList.contains('privacy-mode')));
    document.querySelector('#privacy-toggle').setAttribute('aria-pressed', String(document.body.classList.contains('privacy-mode')));
  }
  if (event.target.closest('[data-save-settings]')) {
    const form = root.querySelector('[data-settings-form]'); if (!form) return;
    const values = new FormData(form); const name = String(values.get('name') || '').trim(); const email = String(values.get('email') || '').trim();
    store.setProfile({ name }); store.setPreference('currency', values.get('currency'));
    document.documentElement.dataset.theme = values.get('theme') || 'system'; localStorage.setItem('savebucks.theme', values.get('theme') || 'system');
    try { if (email !== account.email || name !== account.user_metadata?.name) account = (await updateAccount({ email, name })).user; showToast('Settings saved. Email changes may need confirmation.'); }
    catch (error) { showToast(error.message); }
    render(store.getState());
  }
  if (event.target.closest('[data-open-income]') && store) document.querySelector('#income-form [name="income"]').value = store.getState().incomeByMonth[store.getState().selectedMonth] ?? '';
  if (event.target.closest('[data-workspace-shortcut]')) {
    event.preventDefault(); const workspace = event.target.closest('[data-workspace-shortcut]').dataset.workspaceShortcut;
    activeWorkspace = workspace; document.querySelectorAll('.nav-link[data-workspace]').forEach((link) => link.classList.toggle('active', link.dataset.workspace === workspace)); render(store.getState());
  }
  if (event.target.closest('[data-show-recurring-form]')) { const panel = root.querySelector('[data-recurring-form-panel]'); if (panel) { panel.hidden = false; panel.querySelector('input')?.focus(); } }
  if (event.target.closest('[data-hide-recurring-form]')) { const panel = root.querySelector('[data-recurring-form-panel]'); if (panel) panel.hidden = true; }
  const deleteRecurring = event.target.closest('[data-delete-recurring]');
  if (deleteRecurring && window.confirm('Remove this recurring expense and its automatically generated entries?')) store.deleteRecurringExpense(deleteRecurring.dataset.deleteRecurring);
});
root.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-recurring-form]'); if (!form) return;
  event.preventDefault(); const values = new FormData(form);
  const item = { name: String(values.get('name')).trim(), amount: Number(values.get('amount')), category: values.get('category'), day: Number(values.get('day')) };
  if (!item.name || !item.amount || item.day < 1 || item.day > 28) return;
  store.addRecurringExpense(item); showToast('Recurring expense saved. It will be logged monthly on its due day.');
});

document.addEventListener('change', (event) => { if (event.target.matches('[data-theme-select]')) { document.documentElement.dataset.theme = event.target.value; localStorage.setItem('savebucks.theme', event.target.value); } });
function showToast(message) { document.querySelector('.toast')?.remove(); const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.textContent = message; document.body.append(toast); setTimeout(() => toast.remove(), 3000); }

document.documentElement.dataset.theme = localStorage.getItem('savebucks.theme') || 'system';
if (localStorage.getItem('savebucks.privacy') === 'true') document.body.classList.add('privacy-mode');
