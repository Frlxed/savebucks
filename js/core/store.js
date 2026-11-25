import { loadState, saveState } from './storage.js';

const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export function createStore() {
  let state = loadState();
  let selectedMonth = monthKey();
  const listeners = new Set();

  const publish = () => {
    saveState(state);
    for (const listener of listeners) listener(getState());
  };

  function getState() {
    return { ...state, selectedMonth };
  }

  return {
    getState,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setIncome(amount) {
      state = { ...state, incomeByMonth: { ...state.incomeByMonth, [selectedMonth]: amount } };
      publish();
    },
    addTransaction(transaction) {
      state = { ...state, transactions: [{ ...transaction, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }, ...state.transactions] };
      publish();
    },
    deleteTransaction(id) {
      state = { ...state, transactions: state.transactions.filter((item) => item.id !== id) };
      publish();
    },
    shiftMonth(offset) {
      const [year, month] = selectedMonth.split('-').map(Number);
      selectedMonth = monthKey(new Date(year, month - 1 + offset, 1));
      for (const listener of listeners) listener(getState());
    },
  };
}
