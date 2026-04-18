-- =============================================================================
-- Row-Level Security — spec §7
-- Every table gets RLS ON + a policy that restricts reads/writes to the rows
-- where user_id = auth.uid(). Service-role key bypasses RLS automatically,
-- which is what the Flask backend and cron jobs rely on for cross-user work.
--
-- Policy naming convention: "<verb>_own_<table>" so they're greppable.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ari_users — a user can only see/update their own profile row
-- -----------------------------------------------------------------------------
ALTER TABLE ari_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_ari_users ON ari_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY update_own_ari_users ON ari_users
  FOR UPDATE USING (auth.uid() = id);

-- No INSERT/DELETE policies: profile rows are created via a trigger when the
-- matching auth.users row is created (see 0003_indexes_triggers.sql), and
-- deletion cascades from auth.users.

-- -----------------------------------------------------------------------------
-- Helper: standard per-user-owned policy set
-- Applied below for each table with a user_id column.
-- -----------------------------------------------------------------------------

-- accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_accounts ON accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_accounts ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_accounts ON accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_accounts ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_expenses ON expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_expenses ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_expenses ON expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_expenses ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_budgets ON budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_budgets ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_budgets ON budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_budgets ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_goals ON goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_goals ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_goals ON goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_goals ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- coaching_cache — read-only from the client; writes come from service-role cron
ALTER TABLE coaching_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_coaching_cache ON coaching_cache
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY update_own_coaching_cache ON coaching_cache
  FOR UPDATE USING (auth.uid() = user_id);  -- for is_read toggles

-- tax_profiles
ALTER TABLE tax_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_tax_profiles ON tax_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_tax_profiles ON tax_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_tax_profiles ON tax_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_tax_profiles ON tax_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- budget_rollovers
ALTER TABLE budget_rollovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_budget_rollovers ON budget_rollovers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_budget_rollovers ON budget_rollovers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_budget_rollovers ON budget_rollovers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_budget_rollovers ON budget_rollovers
  FOR DELETE USING (auth.uid() = user_id);

-- user_categories
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_user_categories ON user_categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_user_categories ON user_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_user_categories ON user_categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_user_categories ON user_categories
  FOR DELETE USING (auth.uid() = user_id);

-- todo_notes
ALTER TABLE todo_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_todo_notes ON todo_notes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_todo_notes ON todo_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_todo_notes ON todo_notes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_todo_notes ON todo_notes
  FOR DELETE USING (auth.uid() = user_id);

-- feedbacks — users can insert and view their own; admins read via service-role
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_feedbacks ON feedbacks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_feedbacks ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- coaching_audit — write-only from client, read-only via service-role
ALTER TABLE coaching_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY insert_own_coaching_audit ON coaching_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Intentionally NO select policy — users don't read their own audit log.
