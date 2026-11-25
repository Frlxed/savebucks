import { getCurrency, money } from '../core/currency.js';

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const categoryIcons = { Food: '✳', Transport: '↗', Bills: '⌁', Shopping: '◇', Health: '+', Education: '⌘', Entertainment: '♫', Other: '•' };
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const monthDate = (key) => { const [year, month] = key.split('-').map(Number); return new Date(year, month - 1, 1); };

export function renderDashboard(state) {
  const { selectedMonth, incomeByMonth, transactions, savingsGoals = [] } = state;
  const currency = getCurrency(state);
  const format = (value) => money(value, currency);
  const monthTransactions = transactions.filter((item) => item.date?.startsWith(selectedMonth));
  const income = Number(incomeByMonth[selectedMonth]) || 0;
  const spent = monthTransactions.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  const remaining = income - spent;
  const activeGoals = savingsGoals.filter((goal) => Number(goal.saved) < Number(goal.target)).slice(0, 3);

  return `<div class="dashboard">
    <section class="page-heading" id="overview"><div><span class="eyebrow">YOUR FINANCIAL OVERVIEW</span><h1>Money, in focus<span class="footer-spark">.</span></h1><p>A little clarity today goes a long way tomorrow.</p></div><div class="heading-actions"><div class="month-picker" aria-label="Choose month"><button type="button" data-month-shift="-1" aria-label="Previous month">‹</button><span>${monthFormatter.format(monthDate(selectedMonth))}</span><button type="button" data-month-shift="1" aria-label="Next month">›</button></div><button class="button button-primary" type="button" data-open-expense>+ Add expense</button></div></section>
    <section class="overview-grid" aria-label="Available balance"><article class="balance-card"><span class="eyebrow">AVAILABLE THIS MONTH</span><div class="balance-amount sensitive-value">${format(remaining)}</div><div class="balance-caption">${income ? 'Income minus spending logged for this month.' : 'Add income and transactions to see your balance.'}${income && remaining < 0 ? ' <span class="up">Over budget</span>' : ''}</div><div class="balance-bottom"><div class="balance-mini"><span>MONTHLY INCOME</span><strong class="sensitive-value">${format(income)}</strong></div><div class="balance-separator"></div><div class="balance-mini"><span>TOTAL SPENT</span><strong class="sensitive-value">${format(spent)}</strong></div></div></article></section>
    <section class="stat-row" aria-label="Monthly totals"><article class="stat-card"><div class="stat-label">Spent <span>↗</span></div><div class="stat-value sensitive-value">${format(spent)}</div><div class="stat-foot">${monthTransactions.length} transactions logged</div></article><article class="stat-card"><div class="stat-label">Available <span>◷</span></div><div class="stat-value sensitive-value">${format(remaining)}</div><div class="stat-foot">Based on this month’s income and spending</div></article><article class="stat-card"><div class="stat-label">Savings goals <span>◈</span></div><div class="stat-value">${savingsGoals.length}</div><div class="stat-foot">${activeGoals.length ? 'Keep moving toward what matters' : 'Add a goal in Savings'}</div></article></section>
    <section class="content-grid"><article class="panel"><div class="panel-heading"><div><h2>Recent activity</h2><div class="panel-subtitle">Latest expenses this month</div></div><a class="text-button" href="#transactions" data-workspace-shortcut="transactions">All transactions →</a></div>${renderRecent(monthTransactions, format)}</article><article class="panel"><div class="panel-heading"><div><h2>Things you’re saving for</h2><div class="panel-subtitle">A little progress adds up</div></div><a class="text-button" href="#savings" data-workspace-shortcut="savings">View savings →</a></div>${activeGoals.length ? `<div class="overview-goal-list">${activeGoals.map((goal) => { const target = Number(goal.target) || 0; const saved = Number(goal.saved) || 0; const percent = target ? Math.min(100, saved / target * 100) : 0; return `<div class="overview-goal"><div><strong>${escapeHTML(goal.name)}</strong><span class="sensitive-value">${format(saved)} / ${format(target)}</span></div><div class="goal-progress-track"><div class="goal-progress-fill" style="width:${percent}%"></div></div></div>`; }).join('')}</div>` : '<div class="empty-note">Your savings goals will appear here.</div>'}</article></section>
  </div>`;
}

function renderRecent(transactions, format) {
  if (!transactions.length) return '<div class="empty-transactions"><strong>No expenses just yet.</strong>Add your first expense to start seeing where your money goes.</div>';
  return `<div class="overview-recent-list">${transactions.slice(0, 5).map((item) => `<div class="overview-recent-row"><span class="transaction-badge">${categoryIcons[item.category] || '•'}</span><div class="overview-recent-description"><strong>${escapeHTML(item.description)}</strong><small>${escapeHTML(item.category)} · ${dayFormatter.format(new Date(`${item.date}T12:00:00`))}</small></div><strong class="sensitive-value">−${format(Number(item.quantity) * Number(item.unitPrice))}</strong></div>`).join('')}</div>`;
}

export function mountDashboardControls({ root, store }) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-month-shift]');
    if (button) store.shiftMonth(Number(button.dataset.monthShift));
  });
}
