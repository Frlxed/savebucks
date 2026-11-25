import { createStore } from './core/store.js';
import { renderDashboard, mountDashboardControls } from './features/dashboard.js';
import { mountTransactions } from './features/transactions.js';
import { mountIncome } from './features/income.js';
import { mountNavigation } from './features/navigation.js';

const store = createStore();
const dashboard = document.querySelector('#dashboard-root');

function render(state) {
  dashboard.innerHTML = renderDashboard(state);
}

render(store.getState());
store.subscribe(render);
mountDashboardControls({ root: dashboard, store });
mountTransactions({ root: dashboard, store });
mountIncome({ store });
mountNavigation();
