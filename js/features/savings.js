import { renderDashboard } from './dashboard.js';

const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Keep savings feature styles separate from the rest of the application.
for (const file of ['savings.css', 'savings-calculator.css']) {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL(`./${file}`, import.meta.url).href;
  document.head.append(style);
}

export function setActiveWorkspace() {}

export function renderSavings(state) {
  const goals = state.savingsGoals || [];
  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0);
  const monthlyPlan = goals.reduce((sum, goal) => sum + Number(goal.monthlyContribution || 0), 0);
  const monthlyIncome = Number(state.incomeByMonth[state.selectedMonth]) || 0;

  return `<div class="dashboard savings-workspace">
    <section class="page-heading" id="savings">
      <div><span class="eyebrow">SMALL STEPS, BIG PLANS</span><h1>Your savings<span class="footer-spark">.</span></h1><p>Tell us what you want to buy and what you earn. We’ll work out a monthly plan.</p></div>
      <button class="button button-primary" type="button" data-show-goal-form>＋ Plan a purchase</button>
    </section>
    <section class="savings-summary" aria-label="Savings summary">
      <article class="savings-summary-card savings-summary-feature"><span class="eyebrow">PUTTING ASIDE EACH MONTH</span><strong>${money.format(monthlyPlan)}</strong><span>across your savings goals</span></article>
      <article class="savings-summary-card"><span class="eyebrow">SAVED SO FAR</span><strong>${money.format(totalSaved)}</strong><span>toward ${money.format(totalTarget)} in goals</span></article>
      <article class="savings-summary-card"><span class="eyebrow">ACTIVE GOALS</span><strong>${goals.length}</strong><span>things worth looking forward to</span></article>
    </section>
    <section class="savings-form-panel panel" data-goal-form-panel hidden>
      <div class="panel-heading"><div><h2>Plan something you want</h2><div class="panel-subtitle">Your suggested monthly savings are calculated from your income and chosen savings rate.</div></div><button class="icon-button" type="button" data-hide-goal-form aria-label="Close">×</button></div>
      <form class="savings-form" data-goal-form>
        <label>What do you want to buy?<input name="name" type="text" placeholder="e.g. A new laptop" maxlength="60" required /></label>
        <div class="savings-form-grid savings-input-grid">
          <label>Monthly salary or allowance ($)<input name="income" type="number" min="0.01" step="0.01" value="${monthlyIncome || ''}" placeholder="2,000" required /></label>
          <label>How much does it cost? ($)<input name="target" type="number" min="0.01" step="0.01" placeholder="1,200" required /></label>
          <label>Already saved for it ($)<input name="saved" type="number" min="0" step="0.01" value="0" required /></label>
          <label>Share of income to save (%)<input name="savingsRate" type="number" min="0.1" max="100" step="0.1" value="10" required /></label>
        </div>
        <div class="savings-income-note">10% is a suggested starting point, not a rule. Adjust the percentage to fit your budget.</div>
        <div class="savings-estimate" data-savings-estimate aria-live="polite">
          <div><span>Suggested to save each month</span><strong data-monthly-estimate>${money.format(monthlyIncome * 0.1)}</strong></div>
          <div><span>Estimated time to buy it</span><strong data-time-estimate>${monthlyIncome ? 'Enter an item price' : 'Enter your monthly income'}</strong></div>
        </div>
        <button class="button button-primary" type="submit">Save this plan <span>↗</span></button>
      </form>
    </section>
    <section class="savings-goals-section"><div class="savings-section-heading"><div><h2>Your goals</h2><p>Progress and a realistic estimate for each one.</p></div></div>
      ${goals.length ? `<div class="savings-goal-grid">${goals.map(renderGoal).join('')}</div>` : '<div class="savings-empty"><span>✳</span><strong>Your next big thing starts here.</strong><p>Add an item and your monthly income to get a savings amount and estimated timeline.</p><button class="button button-secondary" type="button" data-show-goal-form>Plan your first purchase</button></div>'}
    </section>
  </div>`;
}

function renderGoal(goal) {
  const target = Math.max(0, Number(goal.target) || 0);
  const saved = Math.min(target, Math.max(0, Number(goal.saved) || 0));
  const monthly = Math.max(0, Number(goal.monthlyContribution) || 0);
  const income = Math.max(0, Number(goal.monthlyIncome) || 0);
  const rate = Number(goal.savingsRate) || (income ? (monthly / income) * 100 : 0);
  const remaining = Math.max(0, target - saved);
  const percent = target ? Math.min(100, (saved / target) * 100) : 0;
  const months = remaining === 0 ? 0 : monthly > 0 ? Math.ceil(remaining / monthly) : null;
  const timeline = months === 0 ? 'You’ve reached your goal!' : months === null ? 'Set a monthly amount to estimate your timeline.' : `About ${formatDuration(months)} to go`;
  const incomeText = income ? `${rate.toFixed(rate % 1 ? 1 : 0)}% of income` : 'Monthly savings plan';
  return `<article class="savings-goal-card"><div class="goal-card-top"><span class="goal-icon">✳</span><button class="delete-button" type="button" data-delete-goal="${escapeHTML(goal.id)}" aria-label="Delete ${escapeHTML(goal.name)}">×</button></div><h3>${escapeHTML(goal.name)}</h3><div class="goal-progress-label"><span>${money.format(saved)} saved</span><span>${Math.round(percent)}%</span></div><div class="goal-progress-track"><div class="goal-progress-fill" style="width:${percent}%"></div></div><div class="goal-target-line"><span>Purchase price</span><strong>${money.format(target)}</strong></div><div class="goal-plan"><div><span>Save each month</span><strong>${money.format(monthly)}<small> · ${incomeText}</small></strong></div><div class="goal-timeline"><span>Estimated time</span><strong>${timeline}</strong></div></div>${remaining > 0 ? `<form class="contribution-form" data-contribution-form="${escapeHTML(goal.id)}"><label>Add to savings ($)<input name="amount" type="number" min="0.01" max="${remaining}" step="0.01" placeholder="Amount" required /></label><button class="button button-secondary" type="submit">Add</button></form>` : '<div class="goal-complete">Goal reached — enjoy the moment ✨</div>'}</article>`;
}

function formatDuration(months) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (remainingMonths) parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`);
  return parts.join(' and ');
}

function updateEstimate(form) {
  const income = Number(form.elements.income.value) || 0;
  const target = Number(form.elements.target.value) || 0;
  const saved = Number(form.elements.saved.value) || 0;
  const rate = Number(form.elements.savingsRate.value) || 0;
  const monthly = income * rate / 100;
  const remaining = Math.max(0, target - saved);
  const monthlyOutput = form.querySelector('[data-monthly-estimate]');
  const timeOutput = form.querySelector('[data-time-estimate]');

  monthlyOutput.textContent = money.format(monthly);
  if (!income) timeOutput.textContent = 'Enter your monthly income';
  else if (!target) timeOutput.textContent = 'Enter an item price';
  else if (saved >= target) timeOutput.textContent = 'You’ve already reached your goal!';
  else if (!monthly) timeOutput.textContent = 'Choose a savings percentage';
  else timeOutput.textContent = `About ${formatDuration(Math.ceil(remaining / monthly))}`;
}

export function mountSavings({ root, store }) {
  const nav = document.querySelector('.nav-links');
  if (!nav.querySelector('[data-workspace="savings"]')) {
    const link = document.createElement('a');
    link.className = 'nav-link';
    link.href = '#savings';
    link.dataset.workspace = 'savings';
    link.innerHTML = '<span class="nav-icon">◈</span> Savings';
    nav.append(link);
  }

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-show-goal-form]')) {
      const panel = root.querySelector('[data-goal-form-panel]');
      if (panel) {
        panel.hidden = false;
        panel.querySelector('input')?.focus();
        const form = panel.querySelector('[data-goal-form]');
        if (form) updateEstimate(form);
      }
    }
    if (event.target.closest('[data-hide-goal-form]')) {
      const panel = root.querySelector('[data-goal-form-panel]');
      if (panel) panel.hidden = true;
    }
    const deleteButton = event.target.closest('[data-delete-goal]');
    if (deleteButton && window.confirm('Delete this savings goal?')) store.deleteSavingsGoal(deleteButton.dataset.deleteGoal);
  });

  root.addEventListener('input', (event) => {
    const form = event.target.closest('[data-goal-form]');
    if (form) updateEstimate(form);
  });

  root.addEventListener('submit', (event) => {
    const goalForm = event.target.closest('[data-goal-form]');
    if (goalForm) {
      event.preventDefault();
      const values = new FormData(goalForm);
      const goal = {
        name: values.get('name').trim(),
        target: Number(values.get('target')),
        saved: Number(values.get('saved')),
        monthlyIncome: Number(values.get('income')),
        savingsRate: Number(values.get('savingsRate')),
      };
      if (goal.saved > goal.target) {
        goalForm.elements.saved.setCustomValidity('Already saved cannot be more than the purchase price.');
        goalForm.elements.saved.reportValidity();
        goalForm.elements.saved.setCustomValidity('');
        return;
      }
      goal.monthlyContribution = goal.monthlyIncome * goal.savingsRate / 100;
      store.addSavingsGoal(goal);
      notify('Savings plan created. You’ve got a clear path.');
      return;
    }

    const contributionForm = event.target.closest('[data-contribution-form]');
    if (contributionForm) {
      event.preventDefault();
      const goal = store.getState().savingsGoals.find((item) => item.id === contributionForm.dataset.contributionForm);
      const contribution = Number(new FormData(contributionForm).get('amount'));
      if (goal && contribution > 0) {
        store.addGoalContribution(goal.id, contribution);
        notify('Savings progress updated.');
      }
    }
  });
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
