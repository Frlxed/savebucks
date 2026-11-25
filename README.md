# SaveBucks

Responsive personal-finance tracker with per-user cloud backups, private monthly transaction data, savings goals, spending insights, recurring bills, currency selection, privacy blur, and appearance settings.

## Run locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>.

## Connect Supabase (required to enable real accounts and backups)

GitHub Pages is static hosting; it cannot securely create accounts or back up finance records on its own. This code uses Supabase Auth + a row-level-security protected Postgres table. The project keys have to be supplied by the owner; they are not present in the repository, so login remains safely disabled until configured.

1. Create a Supabase project. In **Authentication → Providers**, enable email/password and configure Google and Apple providers with their OAuth credentials. Configure callback/redirect URLs for `https://frlxed.github.io/safe-bucks/` (and localhost for development).
2. In `js/core/auth.js`, set `CONFIG.url` to the Supabase project URL and `CONFIG.anonKey` to the project's public anon/publishable key. Never use a service-role key in browser code or commit it.
3. Run `supabase/schema.sql` in the Supabase SQL Editor. The table's RLS policies limit every request to the signed-in user's own row. The schema can be re-run safely.
4. In Supabase Auth URL configuration, set the site URL and allowed redirect URLs to the deployed URL. For Google/Apple, also configure the provider-side redirect URI shown by Supabase.
5. Deploy the site and try signup, confirm email if email confirmation is on, then sign in. The **Keep me signed in** checkbox determines whether the browser session persists across browser restarts or ends with the current tab/session.

The browser app stores refreshable session tokens for auth and a local per-user backup; Supabase cloud data is loaded after authentication and changes are synced. If cloud sync fails, a visible notification warns that only the local copy is safe. Do not store sensitive secrets (service-role keys, OAuth client secrets) in this public repository.

## Features

- Currency selector lists currencies supported by the browser's internationalization data. Currency selection changes display formatting only; it does not convert values.
- Privacy mode blurs balances and transaction amounts (hover/tap-related focus can reveal values).
- Recurring expense templates log one transaction each month after their due day when the site is opened. Static sites cannot run jobs in the background while closed; this is not a bank debit or payment.
- Account data and feature modules are kept separate to make future extensions easier.
