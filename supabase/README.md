# Supabase — Ari

Phase 1 artifacts for the migration described in
[`../SUPABASE_MIGRATION.md`](../SUPABASE_MIGRATION.md).

## Structure

```
supabase/
├── migrations/
│   ├── 20260418000001_init_schema.sql       — all tables
│   ├── 20260418000002_rls_policies.sql      — RLS on every user-owned table
│   └── 20260418000003_indexes_triggers.sql  — indexes + triggers + auto-provision
└── README.md                                — you are here
```

## Applying locally

1. Install the Supabase CLI:
   ```bash
   npm i -g supabase
   ```
2. Start a local stack (spins up Postgres + Auth + Studio on
   http://localhost:54323):
   ```bash
   cd supabase
   supabase start
   ```
3. Migrations auto-apply in order. Verify by opening Studio and confirming
   the tables in the `public` schema match those in
   `20260418000001_init_schema.sql`.

## Applying to the dedicated Ari cloud project

Once the project exists in the Supabase dashboard:

```bash
supabase link --project-ref <ari-project-ref>
supabase db push
```

`db push` runs each unapplied migration in timestamp order.

**Never edit a migration that has been pushed.** Create a new
`YYYYMMDDHHMMSS_<name>.sql` file instead — Supabase tracks applied migrations
by filename hash and will refuse to re-run a mutated file.

## Sanity checklist after applying

In the Studio SQL editor:

```sql
-- All ten user-owned tables must have RLS enabled.
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Insert as anon key should fail — RLS is doing its job.
-- (Run from the JS client with the anon key, NOT the SQL editor, which bypasses RLS.)

-- auth-user trigger provisioned?
SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;
-- Expect: on_auth_user_created
```

## Undo (dev only)

```sql
-- Nuclear option — drops every Ari table. Does NOT touch auth.users.
DROP TABLE IF EXISTS
  coaching_audit, feedbacks, todo_notes, user_categories, budget_rollovers,
  tax_profiles, coaching_cache, goals, budgets, expenses, accounts, ari_users
CASCADE;

DROP FUNCTION IF EXISTS handle_new_auth_user CASCADE;
DROP FUNCTION IF EXISTS touch_updated_at CASCADE;
```

Destructive. Don't run on a project that has real user data.
