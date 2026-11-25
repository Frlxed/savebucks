import { createStore } from './core/store.js';
import { renderDashboard, mountDashboardControls } from './features/dashboard.js';
import { mountTransactions } from './features/transactions.js';
import { mountIncome } from './features/income.js';
import { mountNavigation } from './features/navigation.js';
import { mountSavings, renderSavings, setActiveWorkspace } from './features/savings.js';

const store = createStore();
const dashboard = document.querySelector('#dashboard-root');

function render(state) {
  dashboard.innerHTML = isSavingsWorkspace() ? renderSavings(state) : renderDashboard(state);
}

// Keep the dashboard and savings workspace as separate features sharing one store.
function isSavingsWorkspace() {
  return document.querySelector('.nav-link[data-workspace="savings"]')?.classList.contains('active') ?? false;
}

render(store.getState());
store.subscribe(render);
mountDashboardControls({ root: dashboard, store });
mountTransactions({ root: dashboard, store });
mountIncome({ store });
mountSavings({ root: dashboard, store });
mountNavigation({ onWorkspaceChange: (workspace) => {
  setActiveWorkspace(workspace);
  render(store.getState());
} });
