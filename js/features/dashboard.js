const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const categoryIcons = { Food: '✳', Transport: '↗', Bills: '⌁', Shopping: '◇', Health: '+', Education: '⌘', Entertainment: '♫', Other: '•' };
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const amount = (value) => money.format(Number(value) || 0);
const monthDate = (key) => { const [year, month] = key.split('-').map(Number); return new Date(year, month - 1, 1); };

export function renderDashboard(state) {
  const { selectedMonth, incomeByMonth, transactions } = state;
  const monthTransactions = transactions.filter((item) => item.date?.startsWith(selectedMonth));
  const income = Number(incomeByMonth[selectedMonth]) || 0;
  const spent = monthTransactions.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  const remaining = income - spent;
  const categories = Object.entries(monthTransactions.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + Number(item.quantity) * Number(item.unitPrice);
    return totals;
  }, {})).sort((a, b) => b[1] - a[1]);

  return `<div class="dashboard">
    <section class="page-heading" id="overview">
      <div><span class="eyebrow">YOUR FINANCIAL OVERVIEW</span><h1>Money, in focus<span class="footer-spark">.</span></h1><p>A little clarity today goes a long way tomorrow.</p></div>
      <div class="heading-actions"><div class="month-picker" aria-label="Choose month"><button type="button" data-month-shift="-1" aria-label="Previous month">‹</button><span>${monthFormatter.format(monthDate(selectedMonth))}</span><button type="button" data-month-shift="1" aria-label="Next month">›</button></div><button class="button button-primary" type="button" data-open-expense>+ Add expense</button></div>
    </section>

    <section class="overview-grid" aria-label="Balance and income">
      <article class="balance-card"><span class="eyebrow">AVAILABLE THIS MONTH</span><div class="balance-amount">${amount(remaining)}</div><div class="balance-caption">${income ? 'Your income minus what you’ve spent so far.' : 'Set your income to see what’s available.'}${income && spent > income ? ' <span class="up">Over budget</span>' : ''}</div><div class="balance-bottom"><div class="balance-mini"><span>MONTHLY INCOME</span><strong>${amount(income)}</strong></div><div class="balance-separator"></div><div class="balance-mini"><span>TOTAL SPENT</span><strong>${amount(spent)}</strong></div></div></article>
      <article class="income-card"><div><div class="card-topline"><span class="eyebrow">INCOME · ${escapeHTML(monthFormatter.format(monthDate(selectedMonth)).toUpperCase())}</span><span class="metric-icon">↙</span></div><div class="income-number">${amount(income)}</div><div class="income-hint">Salary, allowance, or other income</div></div><button class="text-button" type="button" data-open-income>${income ? 'Edit monthly income' : '＋ Add monthly income'}</button></article>
    </section>

    <section class="stat-row" aria-label="Monthly totals"><article class="stat-card"><div class="stat-label">Income <span>↙</span></div><div class="stat-value">${amount(income)}</div><div class="stat-foot">For ${escapeHTML(monthFormatter.format(monthDate(selectedMonth)))}</div></article><article class="stat-card"><div class="stat-label">Spent <span>↗</span></div><div class="stat-value">${amount(spent)}</div><div class="stat-foot">${monthTransactions.length} ${monthTransactions.length === 1 ? 'transaction' : 'transactions'} logged</div></article><article class="stat-card"><div class="stat-label">Left to spend <span>◷</span></div><div class="stat-value">${amount(remaining)}</div><div class="stat-foot ${remaining >= 0 ? 'green' : ''}">${income ? `${Math.max(0, Math.round((remaining / income) * 100))}% of income remaining` : 'Add income to set your baseline'}</div></article></section>

    <section class="content-grid"><article class="panel"><div class="panel-heading"><div><h2>Spending rhythm</h2><div class="panel-subtitle">Your last seven days of spending</div></div><div class="chart-total">${amount(spent)}<small>this month</small></div></div>${renderChart(monthTransactions, selectedMonth)}</article><article class="panel" id="insights"><div class="panel-heading"><div><h2>Where it goes</h2><div class="panel-subtitle">Spending by category</div></div><span class="metric-icon">◷</span></div>${renderCategories(categories, spent)}</article></section>

    <section class="panel transactions-panel" id="transactions"><div class="panel-heading"><div><h2>Recent transactions</h2><div class="panel-subtitle">Your activity for ${escapeHTML(monthFormatter.format(monthDate(selectedMonth)))}</div></div><button type="button" class="button button-secondary" data-open-expense>＋ Add new</button></div>${renderTransactions(monthTransactions)}</section>
    <div class="insights-anchor" id="insights-end"></div>
  </div>`;
}

function renderChart(transactions, month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const monthLength = new Date(year, monthNumber, 0).getDate();
  const today = new Date();
  const endDay = month === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}` ? today.getDate() : monthLength;
  const startDay = Math.max(1, endDay - 6);
  const days = Array.from({ length: 7 }, (_, index) => startDay + index).filter((day) => day <= endDay);
  const values = days.map((day) => transactions.filter((item) => Number(item.date.slice(8, 10)) === day).reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${30 + index * (540 / Math.max(values.length - 1, 1))},${155 - (value / max) * 125}`).join(' ');
  const first = points.split(' ')[0]?.split(',') || ['30', '155'];
  const last = points.split(' ').at(-1)?.split(',') || ['570', '155'];
  const area = `${first[0]},155 ${points} ${last[0]},155`;
  const labels = days.map((day) => `<span>${day}</span>`).join('');
  return `<div class="chart-wrap"><svg viewBox="0 0 600 165" role="img" aria-label="Daily spending over the last seven days"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#c4f266" stop-opacity=".19"/><stop offset="100%" stop-color="#c4f266" stop-opacity="0"/></linearGradient></defs><path class="chart-grid" d="M20 30H585M20 75H585M20 120H585M20 155H585"/><polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${points}"/>${values.map((value, index) => { const [x, y] = points.split(' ')[index].split(','); return value ? `<circle class="chart-point" cx="${x}" cy="${y}" r="4"/>` : ''; }).join('')}</svg></div><div class="chart-labels">${labels}</div>`;
}

function renderCategories(categories, total) {
  if (!categories.length) return '<div class="empty-note">Your spending categories will show up here.</div>';
  return `<div class="category-list">${categories.slice(0, 6).map(([name, value]) => `<div class="category-item"><span class="category-name">${escapeHTML(name)}</span><div class="category-track"><div class="category-fill" style="width:${total ? Math.max(2, (value / total) * 100) : 0}%"></div></div><span class="category-value">${amount(value)}</span></div>`).join('')}</div>`;
}

function renderTransactions(transactions) {
  if (!transactions.length) return '<div class="empty-transactions"><strong>No expenses just yet.</strong>Add your first expense to start seeing where your money goes.</div>';
  return `<div class="table-head"><span>DESCRIPTION</span><span>CATEGORY</span><span>DATE</span><span style="text-align:right">AMOUNT</span></div>${transactions.slice(0, 12).map((item) => { const total = Number(item.quantity) * Number(item.unitPrice); return `<div class="transaction-row"><div class="transaction-name"><span class="transaction-badge">${categoryIcons[item.category] || '•'}</span><div><strong>${escapeHTML(item.description)}</strong><small>${Number(item.quantity)} × ${amount(item.unitPrice)}</small></div></div><span class="transaction-category">${escapeHTML(item.category)}</span><span class="transaction-date">${dayFormatter.format(new Date(`${item.date}T12:00:00`))}</span><span class="transaction-amount">−${amount(total)}<button class="delete-button" type="button" data-delete-transaction="${escapeHTML(item.id)}" aria-label="Delete ${escapeHTML(item.description)}">×</button></span></div>`; }).join('')}`;
}

export function mountDashboardControls({ root, store }) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-month-shift]');
    if (button) store.shiftMonth(Number(button.dataset.monthShift));
  });
}
