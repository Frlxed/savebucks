import { getCurrency, money } from '../core/currency.js';

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function renderSavings(state) {
  const goals = state.savingsGoals || [];
  const format = (value) => money(value, getCurrency(state));
  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0);
  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target || 0), 0);
  const monthlyPlan = goals.reduce((sum, goal) => sum + Number(goal.monthlyContribution || 0), 0);
  const income = Number(state.incomeByMonth[state.selectedMonth]) || 0;

  return `<div class="dashboard savings-workspace">
    <section class="page-heading" id="savings"><div><span class="eyebrow">SMALL STEPS, BIG PLANS</span><h1>Your savings<span class="footer-spark">.</span></h1><p>Set a target, choose a monthly amount, and track each contribution.</p></div><button class="button button-primary" type="button" data-show-goal-form>＋ Add savings goal</button></section>
    <section class="savings-summary" aria-label="Savings summary"><article class="savings-summary-card savings-summary-feature"><span class="eyebrow">PLANNED EACH MONTH</span><strong class="sensitive-value">${format(monthlyPlan)}</strong><span>across your goals</span></article><article class="savings-summary-card"><span class="eyebrow">SAVED SO FAR</span><strong class="sensitive-value">${format(totalSaved)}</strong><span>toward ${format(totalTarget)}</span></article><article class="savings-summary-card"><span class="eyebrow">ACTIVE GOALS</span><strong>${goals.length}</strong><span>things to look forward to</span></article></section>
    <section class="savings-form-panel panel" data-goal-form-panel hidden><div class="panel-heading"><div><h2>Create a savings goal</h2><div class="panel-subtitle">Choose a monthly contribution you can comfortably afford.</div></div><button class="icon-button" type="button" data-hide-goal-form aria-label="Close">×</button></div><form class="savings-form" data-goal-form><label>What are you saving for?<input name="name" type="text" maxlength="60" placeholder="e.g. A new laptop" required /></label><div class="savings-form-grid savings-input-grid"><label>Target cost (${getCurrency(state)})<input name="target" type="number" min="0.01" step="0.01" placeholder="1,200" required /></label><label>Already saved (${getCurrency(state)})<input name="saved" type="number" min="0" step="0.01" value="0" required /></label><label>Monthly contribution (${getCurrency(state)})<input name="monthlyContribution" type="number" min="0.01" step="0.01" placeholder="100" required /></label></div><p class="savings-income-note">Monthly income on file: <strong>${format(income)}</strong> · Update it in Settings if needed.</p><div class="savings-estimate" aria-live="polite"><div><span>Time to reach your goal</span><strong data-time-estimate>Enter a target and monthly amount</strong></div><div><span>Monthly income</span><strong>${format(income)}</strong></div></div><button class="button button-primary" type="submit">Save goal <span>↗</span></button></form></section>
    <section class="savings-goals-section"><div class="savings-section-heading"><div><h2>Your goals</h2><p>Progress updates as you log contributions.</p></div></div>${goals.length ? `<div class="savings-goal-grid">${goals.map((goal) => renderGoal(goal, format, getCurrency(state))).join('')}</div>` : '<div class="savings-empty"><span>✳</span><strong>Your next big thing starts here.</strong><p>Create a goal and log contributions as you save.</p><button class="button button-secondary" type="button" data-show-goal-form>Create your first goal</button></div>'}</section>
  </div>`;
}

function renderGoal(goal, format, currency) {
  const target = Math.max(0, Number(goal.target) || 0);
  const saved = Math.min(target, Math.max(0, Number(goal.saved) || 0));
  const monthly = Math.max(0, Number(goal.monthlyContribution) || 0);
  const remaining = Math.max(0, target - saved);
  const progress = target ? Math.min(100, saved / target * 100) : 0;
  const months = remaining === 0 ? 0 : monthly > 0 ? Math.ceil(remaining / monthly) : null;
  const timeline = months === 0 ? 'Goal reached!' : months ? `About ${formatDuration(months)} to go` : 'Add a monthly amount to estimate';
  return `<article class="savings-goal-card"><div class="goal-card-top"><span class="goal-icon">✳</span><button class="delete-button" type="button" data-delete-goal="${escapeHTML(goal.id)}" aria-label="Delete ${escapeHTML(goal.name)}">×</button></div><h3>${escapeHTML(goal.name)}</h3><div class="goal-progress-label"><span class="sensitive-value">${format(saved)} saved</span><span>${Math.round(progress)}%</span></div><div class="goal-progress-track"><div class="goal-progress-fill" style="width:${progress}%"></div></div><div class="goal-target-line"><span>Target</span><strong class="sensitive-value">${format(target)}</strong></div><div class="goal-plan"><div><span>Monthly contribution</span><strong class="sensitive-value">${format(monthly)}</strong></div><div class="goal-timeline"><span>Estimated time</span><strong>${timeline}</strong></div></div>${remaining > 0 ? `<form class="contribution-form" data-contribution-form="${escapeHTML(goal.id)}"><label>Log a contribution (${currency})<input name="amount" type="number" min="0.01" max="${remaining}" step="0.01" placeholder="Amount saved" required /></label><button class="button button-secondary" type="submit">Add contribution</button></form>` : '<div class="goal-complete">Goal reached — enjoy the moment ✨</div>'}</article>`;
}

function formatDuration(months) {
  const years = Math.floor(months / 12); const remainingMonths = months % 12;
  return [years ? `${years} ${years === 1 ? 'year' : 'years'}` : '', remainingMonths ? `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}` : ''].filter(Boolean).join(' and ');
}

function updateEstimate(form, currency) {
  const target = Number(form.elements.target.value) || 0;
  const saved = Number(form.elements.saved.value) || 0;
  const monthly = Number(form.elements.monthlyContribution.value) || 0;
  const remaining = Math.max(0, target - saved);
  const output = form.querySelector('[data-time-estimate]');
  output.textContent = !target ? 'Enter a target and monthly amount' : remaining === 0 ? 'You’ve already reached this goal' : monthly ? `About ${formatDuration(Math.ceil(remaining / monthly))} to go` : 'Enter a monthly contribution';
}

export function mountSavings({ root, store }) {
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
  root.addEventListener('input', (event) => {
    const form = event.target.closest('[data-goal-form]');
    if (form) updateEstimate(form, getCurrency(store.getState()));
  });
  root.addEventListener('submit', (event) => {
    const goalForm = event.target.closest('[data-goal-form]');
    if (goalForm) {
      event.preventDefault();
      const values = new FormData(goalForm);
      const goal = { name: String(values.get('name')).trim(), target: Number(values.get('target')), saved: Number(values.get('saved')), monthlyContribution: Number(values.get('monthlyContribution')) };
      if (!goal.name || !goal.target || !goal.monthlyContribution) return;
      if (goal.saved > goal.target) { goalForm.elements.saved.setCustomValidity('Already saved cannot be more than the target.'); goalForm.elements.saved.reportValidity(); goalForm.elements.saved.setCustomValidity(''); return; }
      store.addSavingsGoal(goal); notify('Savings goal saved.'); return;
    }
    const contributionForm = event.target.closest('[data-contribution-form]');
    if (contributionForm) {
      event.preventDefault();
      const goal = store.getState().savingsGoals.find((item) => item.id === contributionForm.dataset.contributionForm);
      const contribution = Number(new FormData(contributionForm).get('amount'));
      if (goal && contribution > 0) { store.addGoalContribution(goal.id, contribution); notify('Contribution logged.'); }
    }
  });
}
function notify(message) { document.querySelector('.toast')?.remove(); const toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.textContent = message; document.body.append(toast); window.setTimeout(() => toast.remove(), 2600); }
