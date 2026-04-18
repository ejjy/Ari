-- =============================================================================
-- Indexes + triggers + ari_users auto-provision
-- - Indexes match spec §4 explicit CREATE INDEX lines + common analytics paths
-- - Single updated_at trigger function reused across all tables
-- - ari_users row is auto-created when a matching auth.users row is created
--   so the rest of the app can assume ari_users.id always exists
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Indexes (spec §4)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_expenses_user_date      ON expenses (user_id, expense_date DESC);
CREATE INDEX idx_expenses_category       ON expenses (user_id, category);
CREATE INDEX idx_expenses_merchant       ON expenses (user_id, merchant_id) WHERE merchant_id IS NOT NULL;
CREATE INDEX idx_expenses_account        ON expenses (account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_expenses_recurring      ON expenses (parent_recurring_id) WHERE parent_recurring_id IS NOT NULL;

CREATE INDEX idx_coaching_user           ON coaching_cache (user_id, type, period_start DESC);

CREATE INDEX idx_budgets_user_month      ON budgets (user_id, month DESC);
CREATE INDEX idx_goals_user_status       ON goals (user_id, status);
CREATE INDEX idx_accounts_user           ON accounts (user_id);
CREATE INDEX idx_budget_rollovers_user   ON budget_rollovers (user_id, to_month DESC);
CREATE INDEX idx_user_categories_user    ON user_categories (user_id, type, sort_order);
CREATE INDEX idx_todo_notes_user         ON todo_notes (user_id, is_done, pinned DESC, due_date);
CREATE INDEX idx_feedbacks_created       ON feedbacks (created_at DESC);
CREATE INDEX idx_coaching_audit_user     ON coaching_audit (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- updated_at trigger — single function, reused across tables that track it
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ari_users_touch_updated_at
  BEFORE UPDATE ON ari_users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER goals_touch_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER tax_profiles_touch_updated_at
  BEFORE UPDATE ON tax_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER todo_notes_touch_updated_at
  BEFORE UPDATE ON todo_notes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-provision ari_users row on auth.users insert
-- The app + migration script populate the profile fields separately via an
-- UPDATE; this trigger just guarantees a row exists so FK refs never dangle.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ari_users (id, email, phone, name, age_group, income_bracket, main_goal)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    -- Pull display name from OAuth metadata; fall back to email prefix.
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1),
      'User'
    ),
    -- Onboarding placeholders — the registration route overwrites these.
    COALESCE(NEW.raw_user_meta_data->>'age_group', '25-35'),
    COALESCE(NEW.raw_user_meta_data->>'income_bracket', '15k-30k'),
    COALESCE(NEW.raw_user_meta_data->>'main_goal', 'save_more')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

COMMENT ON FUNCTION handle_new_auth_user() IS
  'Creates the ari_users profile row whenever a new auth.users row appears (email/OAuth/phone OTP signup).';
