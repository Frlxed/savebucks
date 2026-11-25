const STORAGE_KEY = 'safebucks.data';
const CURRENT_VERSION = 3;

const emptyState = () => ({ version: CURRENT_VERSION, incomeByMonth: {}, transactions: [], savingsGoals: [], profile: {} });

export function loadState(userId = 'local') {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}.${userId}`);
    return saved ? migrate(JSON.parse(saved)) : emptyState();
  } catch (error) { console.warn('SaveBucks could not load saved data.', error); return emptyState(); }
}

export function saveState(state, userId = 'local') {
  try { localStorage.setItem(`${STORAGE_KEY}.${userId}`, JSON.stringify(state)); }
  catch (error) { console.warn('SaveBucks could not save data.', error); }
}

function migrate(data) {
  if (!data || typeof data !== 'object') return emptyState();
  return {
    ...emptyState(), ...data, version: CURRENT_VERSION,
    incomeByMonth: data.incomeByMonth && typeof data.incomeByMonth === 'object' ? data.incomeByMonth : {},
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    savingsGoals: Array.isArray(data.savingsGoals) ? data.savingsGoals : [],
    profile: data.profile && typeof data.profile === 'object' ? data.profile : {},
  };
}
