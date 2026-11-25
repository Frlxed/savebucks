import { getCurrency, money } from '../core/currency.js';
export function mountIncome({ store }) {
  const dialog = document.querySelector('#income-dialog'); const form = document.querySelector('#income-form');
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-income]')) { form.elements.income.value = store.getState().incomeByMonth[store.getState().selectedMonth] ?? ''; dialog.showModal(); }
    if (event.target.closest('[data-close-dialog="income-dialog"]')) dialog.close();
  });
  const updateCurrencyLabel = () => { const label = form.querySelector('[data-income-currency]'); if (label) label.textContent = getCurrency(store.getState()); };
  updateCurrencyLabel(); store.subscribe(updateCurrencyLabel);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  form.addEventListener('submit', (event) => { event.preventDefault(); store.setIncome(Number(new FormData(form).get('income'))); dialog.close(); notify('Monthly income updated.'); });
}
function notify(message) { document.querySelector('.toast')?.remove(); const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.textContent = message; document.body.append(toast); window.setTimeout(() => toast.remove(), 2600); }
