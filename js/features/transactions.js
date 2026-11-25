export function mountTransactions({ root, store }) {
  const dialog = document.querySelector('#expense-dialog');
  const form = document.querySelector('#expense-form');
  const dateField = form.elements.date;
  const quantityField = form.elements.quantity;
  const priceField = form.elements.unitPrice;
  const preview = document.querySelector('#expense-preview');
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-expense]')) {
      dateField.value = `${store.getState().selectedMonth}-${String(new Date().getDate()).padStart(2, '0')}`;
      // Keep dates valid when viewing a month with fewer days than today.
      const [year, month] = store.getState().selectedMonth.split('-').map(Number);
      const maxDay = new Date(year, month, 0).getDate();
      dateField.value = `${store.getState().selectedMonth}-${String(Math.min(new Date().getDate(), maxDay)).padStart(2, '0')}`;
      dialog.showModal();
    }

    const deleteButton = event.target.closest('[data-delete-transaction]');
    if (deleteButton) store.deleteTransaction(deleteButton.dataset.deleteTransaction);
  });

  function updatePreview() {
    preview.textContent = money.format((Number(quantityField.value) || 0) * (Number(priceField.value) || 0));
  }
  quantityField.addEventListener('input', updatePreview);
  priceField.addEventListener('input', updatePreview);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(form);
    store.addTransaction({
      description: values.get('description').trim(),
      category: values.get('category'),
      date: values.get('date'),
      quantity: Number(values.get('quantity')),
      unitPrice: Number(values.get('unitPrice')),
    });
    form.reset();
    quantityField.value = '1';
    updatePreview();
    dialog.close();
    notify('Expense saved. Nice and clear.');
  });

  document.addEventListener('click', (event) => {
    const close = event.target.closest('[data-close-dialog="expense-dialog"]');
    if (close) dialog.close();
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
}

function notify(message) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2600);
}
