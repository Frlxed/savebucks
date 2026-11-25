import { loadState, saveState } from './storage.js';

const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export function createStore({ userId = 'local', initialState = null, onChange = () => {} } = {}) {
  let state = initialState || loadState(userId);
  let selectedMonth = monthKey();
  const listeners = new Set();
  const publish = () => {
    saveState(state, userId);
    onChange(state);
    for (const listener of listeners) listener(getState());
  };
  function getState() { return { ...state, selectedMonth }; }

  return {
    getState,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    setIncome(amount) { state = { ...state, incomeByMonth: { ...state.incomeByMonth, [selectedMonth]: amount } }; publish(); },
    addTransaction(transaction) { state = { ...state, transactions: [{ ...transaction, id: createId() }, ...state.transactions] }; publish(); },
    deleteTransaction(id) { state = { ...state, transactions: state.transactions.filter((item) => item.id !== id) }; publish(); },
    addSavingsGoal(goal) { state = { ...state, savingsGoals: [{ ...goal, id: createId() }, ...state.savingsGoals] }; publish(); },
    deleteSavingsGoal(id) { state = { ...state, savingsGoals: state.savingsGoals.filter((goal) => goal.id !== id) }; publish(); },
    addGoalContribution(id, amount) {
      state = { ...state, savingsGoals: state.savingsGoals.map((goal) => goal.id === id ? { ...goal, saved: Math.min(Number(goal.target), Number(goal.saved) + amount) } : goal) };
      publish();
    },
    addRecurringExpense(expense) { state = { ...state, recurringExpenses: [{ ...expense, id: createId() }, ...state.recurringExpenses] }; publish(); },
    deleteRecurringExpense(id) {
      state = { ...state, recurringExpenses: state.recurringExpenses.filter((item) => item.id !== id), transactions: state.transactions.filter((item) => item.recurringId !== id) };
      publish();
    },
    addRecurringTransaction(transaction) {
      if (state.transactions.some((item) => item.recurringId === transaction.recurringId && item.recurringMonth === transaction.recurringMonth)) return false;
      state = { ...state, transactions: [{ ...transaction, id: createId() }, ...state.transactions] };
      publish();
      return true;
    },
    setPreference(key, value) { state = { ...state, preferences: { ...(state.preferences || {}), [key]: value } }; publish(); },
    setProfile(profile) { state = { ...state, profile: { ...(state.profile || {}), ...profile } }; publish(); },
    shiftMonth(offset) {
      const [year, month] = selectedMonth.split('-').map(Number);
      selectedMonth = monthKey(new Date(year, month - 1 + offset, 1));
      for (const listener of listeners) listener(getState());
    },
  };
}
