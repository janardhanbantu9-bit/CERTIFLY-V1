# Pointing Certifly at your own Supabase project

These scripts recreate the full Certifly schema on a fresh, empty Supabase
project. No application code changes are needed — switching databases is just
an environment-variable swap.

## 1. Create the project

In Supabase, create a new project and wait for it to finish provisioning.

## 2. Run the schema script

Open **SQL Editor** → **New query**, paste all of `db/setup.sql`, and run it.

This creates:

- `app_role` enum (`admin`, `user`)
- `user_roles` table and the `has_role()` security-definer function
- `events`, `certificates`, `certificate_contacts` tables
- Grants for `anon` / `authenticated` / `service_role`
- Row-level security: anyone can read a certificate for public verification;
  only admins can create, edit, or delete events and certificates; participant
  emails in `certificate_contacts` are admin-only
- `updated_at` triggers on `events` and `certificates`

The script is safe to re-run.

## 3. Create the admin users

**Authentication → Users → Add user → Create new user**, four times:

| Email                   | Password         |
| ----------------------- | ---------------- |
| `admin1@certifly.local` | `CERTIFLY_ADMIN` |
| `admin2@certifly.local` | `CERTIFLY_ADMIN` |
| `admin3@certifly.local` | `CERTIFLY_ADMIN` |
| `admin4@certifly.local` | `CERTIFLY_ADMIN` |

Tick **Auto Confirm User** for each. The app's sign-in form takes the username
`ADMIN1`–`ADMIN4` and turns it into `<username>@certifly.local`, so use these
exact addresses.

## 4. Grant the admin role

Back in the SQL Editor, run `db/admins.sql`. The final `SELECT` should list the
four accounts with `role = admin`.

## 5. Disable public sign-ups

**Authentication → Sign In / Providers → Email**: turn off "Allow new users to
sign up" so only your four admin accounts exist.

## 6. Point the app at the new database

Set these in your local `.env` (already gitignored) and in your hosting
provider's environment settings:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your anon / publishable key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
```

Find them under **Project Settings → API**. Only the publishable/anon key
belongs in the app — never commit a `.env` file or expose the service role key.

Restart the dev server after changing `.env`.

## 7. Verify

1. Sign in at `/auth` as `ADMIN1` / `CERTIFLY_ADMIN` → you should land on `/create`.
2. Generate a certificate, then scan or open its QR link `/verify/<code>` in a
   signed-out browser — it should verify publicly.
3. `/dashboard` should list the event and its certificates.
