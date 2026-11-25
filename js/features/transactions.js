import { getCurrency, money } from '../core/currency.js';

export function mountTransactions({ root, store }) {
  const dialog = document.querySelector('#expense-dialog');
  const form = document.querySelector('#expense-form');
  const dateField = form.elements.date;
  const quantityField = form.elements.quantity;
  const priceField = form.elements.unitPrice;
  const preview = document.querySelector('#expense-preview');

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-expense]')) {
      const selectedMonth = store.getState().selectedMonth;
      const [year, month] = selectedMonth.split('-').map(Number);
      const maxDay = new Date(year, month, 0).getDate();
      dateField.value = `${selectedMonth}-${String(Math.min(new Date().getDate(), maxDay)).padStart(2, '0')}`;
      dialog.showModal();
    }
    const deleteButton = event.target.closest('[data-delete-transaction]');
    if (deleteButton) store.deleteTransaction(deleteButton.dataset.deleteTransaction);
  });

  function updatePreview() { preview.textContent = money((Number(quantityField.value) || 0) * (Number(priceField.value) || 0), getCurrency(store.getState())); }
  quantityField.addEventListener('input', updatePreview);
  priceField.addEventListener('input', updatePreview);
  store.subscribe(updatePreview);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(form);
    store.addTransaction({ description: values.get('description').trim(), category: values.get('category'), date: values.get('date'), quantity: Number(values.get('quantity')), unitPrice: Number(values.get('unitPrice')) });
    form.reset(); quantityField.value = '1'; updatePreview(); dialog.close(); notify('Expense saved. Nice and clear.');
  });
  document.addEventListener('click', (event) => { if (event.target.closest('[data-close-dialog="expense-dialog"]')) dialog.close(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}

function notify(message) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.textContent = message;
  document.body.append(toast); window.setTimeout(() => toast.remove(), 2600);
}
