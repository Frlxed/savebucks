const STORAGE_KEY = 'safebucks.data';
const CURRENT_VERSION = 2;

const emptyState = () => ({
  version: CURRENT_VERSION,
  incomeByMonth: {},
  transactions: [],
  savingsGoals: [],
});

/**
 * Keep persistence and schema migrations isolated from the UI. When the data
 * shape changes, add a migration here rather than rewriting the app features.
 */
export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState();

    const parsed = JSON.parse(saved);
    return migrate(parsed);
  } catch (error) {
    console.warn('SafeBucks could not load saved data.', error);
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('SafeBucks could not save data.', error);
  }
}

function migrate(data) {
  if (!data || typeof data !== 'object') return emptyState();

  // Existing v1 income and transactions are preserved while savings is added.
  const migrated = { ...emptyState(), ...data, version: CURRENT_VERSION };
  migrated.incomeByMonth = migrated.incomeByMonth || {};
  migrated.transactions = Array.isArray(migrated.transactions) ? migrated.transactions : [];
  migrated.savingsGoals = Array.isArray(migrated.savingsGoals) ? migrated.savingsGoals : [];
  return migrated;
}
