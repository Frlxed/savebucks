import { renderDashboard } from './dashboard.js';

let activeWorkspace = 'overview';
const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Feature styling is isolated so the existing dashboard stylesheet stays untouched.
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = new URL('./savings.css', import.meta.url).href;
document.head.append(style);

export function setActiveWorkspace(workspace) {
  activeWorkspace = workspace;
}

export function renderSavings(state) {
  const goals = state.savingsGoals || [];
  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0);
  const monthlyPlan = goals.reduce((sum, goal) => sum + Number(goal.monthlyContribution || 0), 0);

  return `<div class="dashboard savings-workspace">
    <section class="page-heading" id="savings">
      <div><span class="eyebrow">SMALL STEPS, BIG PLANS</span><h1>Your savings<span class="footer-spark">.</span></h1><p>Give the things you want a clear path to happen.</p></div>
      <button class="button button-primary" type="button" data-show-goal-form>＋ New savings goal</button>
    </section>
    <section class="savings-summary" aria-label="Savings summary">
      <article class="savings-summary-card savings-summary-feature"><span class="eyebrow">PUTTING ASIDE EACH MONTH</span><strong>${money.format(monthlyPlan)}</strong><span>across your savings goals</span></article>
      <article class="savings-summary-card"><span class="eyebrow">SAVED SO FAR</span><strong>${money.format(totalSaved)}</strong><span>toward ${money.format(totalTarget)} in goals</span></article>
      <article class="savings-summary-card"><span class="eyebrow">ACTIVE GOALS</span><strong>${goals.length}</strong><span>things worth looking forward to</span></article>
    </section>
    <section class="savings-form-panel panel" data-goal-form-panel hidden>
      <div class="panel-heading"><div><h2>Make a savings plan</h2><div class="panel-subtitle">Choose a goal and a monthly amount that feels realistic.</div></div><button class="icon-button" type="button" data-hide-goal-form aria-label="Close">×</button></div>
      <form class="savings-form" data-goal-form>
        <label>What are you saving for?<input name="name" type="text" placeholder="e.g. A new laptop" maxlength="60" required /></label>
        <div class="savings-form-grid"><label>How much does it cost? ($)<input name="target" type="number" min="0.01" step="0.01" placeholder="1,200" required /></label><label>Already saved ($)<input name="saved" type="number" min="0" step="0.01" value="0" required /></label><label>Save each month ($)<input name="monthlyContribution" type="number" min="0.01" step="0.01" placeholder="100" required /></label></div>
        <div class="savings-income-note">Your monthly income: <strong>${money.format(Number(state.incomeByMonth[state.selectedMonth]) || 0)}</strong> <span>Pick an amount you can comfortably set aside.</span></div>
        <button class="button button-primary" type="submit">Create savings plan <span>↗</span></button>
      </form>
    </section>
    <section class="savings-goals-section"><div class="savings-section-heading"><div><h2>Your goals</h2><p>Progress and a realistic estimate for each one.</p></div></div>
      ${goals.length ? `<div class="savings-goal-grid">${goals.map(renderGoal).join('')}</div>` : '<div class="savings-empty"><span>✳</span><strong>Your next big thing starts here.</strong><p>Add a savings goal to see your progress and estimated time to reach it.</p><button class="button button-secondary" type="button" data-show-goal-form>Create your first goal</button></div>'}
    </section>
  </div>`;
}

function renderGoal(goal) {
  const target = Math.max(0, Number(goal.target) || 0);
  const saved = Math.min(target, Math.max(0, Number(goal.saved) || 0));
  const monthly = Math.max(0, Number(goal.monthlyContribution) || 0);
  const remaining = Math.max(0, target - saved);
  const percent = target ? Math.min(100, (saved / target) * 100) : 0;
  const months = remaining === 0 ? 0 : monthly > 0 ? Math.ceil(remaining / monthly) : null;
  const timeline = months === 0 ? 'You’ve reached your goal!' : months === null ? 'Set a monthly amount to estimate your timeline.' : `About ${formatDuration(months)} to go`;
  return `<article class="savings-goal-card"><div class="goal-card-top"><span class="goal-icon">✳</span><button class="delete-button" type="button" data-delete-goal="${escapeHTML(goal.id)}" aria-label="Delete ${escapeHTML(goal.name)}">×</button></div><h3>${escapeHTML(goal.name)}</h3><div class="goal-progress-label"><span>${money.format(saved)} saved</span><span>${Math.round(percent)}%</span></div><div class="goal-progress-track"><div class="goal-progress-fill" style="width:${percent}%"></div></div><div class="goal-target-line"><span>Goal amount</span><strong>${money.format(target)}</strong></div><div class="goal-plan"><div><span>Monthly plan</span><strong>${money.format(monthly)}<small> / month</small></strong></div><div class="goal-timeline"><span>Estimated timeline</span><strong>${timeline}</strong></div></div>${remaining > 0 ? `<form class="contribution-form" data-contribution-form="${escapeHTML(goal.id)}"><label>Add to savings ($)<input name="amount" type="number" min="0.01" max="${remaining}" step="0.01" placeholder="Amount" required /></label><button class="button button-secondary" type="submit">Add</button></form>` : '<div class="goal-complete">Goal reached — enjoy the moment ✨</div>'}</article>`;
}

function formatDuration(months) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (remainingMonths) parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`);
  return parts.join(' and ');
}

export function mountSavings({ root, store }) {
  const nav = document.querySelector('.nav-links');
  const link = document.createElement('a');
  link.className = 'nav-link';
  link.href = '#savings';
  link.dataset.workspace = 'savings';
  link.innerHTML = '<span class="nav-icon">◈</span> Savings';
  nav.append(link);

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-show-goal-form]')) {
      const panel = root.querySelector('[data-goal-form-panel]');
      if (panel) { panel.hidden = false; panel.querySelector('input')?.focus(); }
    }
    if (event.target.closest('[data-hide-goal-form]')) {
      const panel = root.querySelector('[data-goal-form-panel]');
      if (panel) panel.hidden = true;
    }
    const deleteButton = event.target.closest('[data-delete-goal]');
    if (deleteButton && window.confirm('Delete this savings goal?')) store.deleteSavingsGoal(deleteButton.dataset.deleteGoal);
  });

  root.addEventListener('submit', (event) => {
    const goalForm = event.target.closest('[data-goal-form]');
    if (goalForm) {
      event.preventDefault();
      const values = new FormData(goalForm);
      const goal = { name: values.get('name').trim(), target: Number(values.get('target')), saved: Number(values.get('saved')), monthlyContribution: Number(values.get('monthlyContribution')) };
      if (goal.saved > goal.target) { goalForm.elements.saved.setCustomValidity('Already saved cannot be more than the goal amount.'); goalForm.elements.saved.reportValidity(); goalForm.elements.saved.setCustomValidity(''); return; }
      store.addSavingsGoal(goal);
      notify('Savings goal created. You’ve got a plan.');
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
