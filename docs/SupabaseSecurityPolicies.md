# Applying Supabase Security Policies

This project defines a set of row level security (RLS) policies in the migration
`supabase/migrations/20250614225001-0360dc2b-f93c-477e-a861-628af5176074.sql` and
`supabase/migrations/20250711000000-add-admin-policy.sql`. Follow these steps to
apply them to your Supabase project.

## 1. Install the Supabase CLI

If you haven't already, install the [Supabase CLI](https://supabase.com/docs/guides/cli).
On macOS you can run:

```bash
brew install supabase/tap/supabase
```

For other platforms, see the official documentation.

## 2. Link the CLI to your project

Run the following command from the repository root to link the CLI to the
project referenced in `supabase/config.toml`:

```bash
supabase link --project-ref rknxtatvlzunatpyqxro
```

## 3. Push the migrations

Once linked, apply the latest migrations so the new RLS policies and functions
are created:

```bash
supabase db push
```

This executes all SQL files under `supabase/migrations` against your remote
Supabase database.

## 4. Verify the policies

After the migration succeeds, confirm that each table has the intended RLS
policies:

1. `public.profiles` – users can insert their own profile.
2. `public.books` – authenticated users can insert, update and delete their own
   books while anyone can read them.
3. `public.contact_messages` – only authenticated users can `SELECT` messages.
4. `public.groups` – authenticated users can manage groups they created.
5. `public.group_members` – users can update their own membership rows.
6. `public.user_books` – users can update their own reading status.

If any policy is missing, run `supabase db push` again or check the migration
output for errors.
