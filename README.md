# SaveBucks

A responsive personal-finance dashboard with separate workspaces for overview, transactions, insights, savings, and settings. The app is organized as small ES modules so new workspaces can be added independently.

## Run locally

Serve the project root (native JavaScript modules need a web server):

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Secure accounts and cloud sync (required for login)

The site uses Supabase Auth and a per-user cloud-data table. GitHub Pages is static hosting, so it cannot securely create or store accounts itself. Connect a Supabase project before enabling account access:

1. Create a Supabase project and enable email/password, Google, and Apple providers under **Authentication → Providers**. Configure each OAuth provider's credentials and redirect URLs in Supabase.
2. In **Project Settings → API**, copy the Project URL and the public anon key into `CONFIG.url` and `CONFIG.anonKey` in `js/core/auth.js`. The anon key is intended for browser use; never put a service-role key in this repository.
3. Run `supabase/schema.sql` in the Supabase SQL Editor. Its row-level security policies restrict each signed-in user to their own finance data.
4. Add your GitHub Pages URL to Supabase's allowed redirect URLs, then deploy. Email confirmation may need to be enabled/configured in Supabase.

Until configured, the login screen explains that setup is needed and does not pretend to create insecure local accounts. Google/Apple buttons use Supabase OAuth once provider setup is complete. Supabase users and finance data sync to their account; offline copies are namespaced per account in this browser.

## Included

- Collapsible desktop navigation and mobile slide-out menu.
- Overview with available balance and savings-goal preview, without the income card.
- Separate transaction and insights workspaces.
- Savings purchase calculator with monthly savings rate and time-to-goal estimate.
- Settings for light, dark, or device appearance; username, email, and monthly income.
- Per-user cloud sync, email/password signup/login, Google and Apple OAuth (after Supabase setup).

Currency display is currently USD. Finance data is saved in browser storage and synced to Supabase when configured. Clearing browser storage removes the local copy, but synced data remains in the account.
