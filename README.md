# SafeBucks

A calm, dark-mode personal finance dashboard for tracking monthly income and expenses.

## Run locally

Because the app uses native JavaScript modules, serve this folder from a local web server rather than opening `index.html` directly. For example:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Included

- Set salary, allowance, or other income by month.
- Log expenses with a description, category, date, quantity, and per-item price.
- See monthly available balance, totals, recent activity, category spending, and a seven-day spending chart.
- Change months and remove transactions.
- Save data privately in this browser using `localStorage`.

## Extend without a rewrite

The app is split into small ES modules:

- `js/app.js` wires the app together.
- `js/core/store.js` contains state and actions.
- `js/core/storage.js` handles persistence and schema migrations.
- `js/features/` contains independent UI features.

To add a feature, create a module in `js/features/`, export a mount function, and register it from `js/app.js`. Keep persistent data changes in the store and add a migration in `js/core/storage.js` when the saved-data schema needs to change. The dashboard reads from the shared store and redraws when state changes.

All financial data stays in this browser; clearing browser storage will remove it. Currency is currently displayed in USD.
