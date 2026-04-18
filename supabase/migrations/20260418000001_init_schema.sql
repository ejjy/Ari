-- =============================================================================
-- Ari v1 — initial schema
-- Target: Supabase Postgres (dedicated Ari project, public schema)
-- Mirrors Tech Spec v1 §4, with fields retained from the Flask + SQLAlchemy
-- models that are already live on Railway so no existing functionality breaks.
--
-- Conventions:
--   - Every user-owned row has a user_id UUID FK to ari_users(id)
--   - ari_users.id is the same UUID as auth.users.id — this is what makes
--     `auth.uid() = user_id` work in RLS policies (see 0002_rls_policies.sql)
--   - Timestamps are TIMESTAMPTZ; dates are DATE; money is NUMERIC(12,2)
--   - JSONB for any payload we don't want to query field-by-field
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ari_users — profile row keyed to auth.users
-- -----------------------------------------------------------------------------
-- Password is NOT stored here; it lives in auth.users (managed by Supabase
-- Auth). We keep our product-specific onboarding fields (age_group,
-- income_bracket, main_goal, role) that don't belong in auth.users.
CREATE TABLE ari_users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE,
  phone           TEXT,
  name            TEXT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'INR',
  monthly_income  NUMERIC(12,2),
  tier            TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pilot', 'pro', 'family')),

  -- Onboarding (app-specific, not in spec §4 but already live)
  age_group       TEXT NOT NULL,
  income_bracket  TEXT NOT NULL,
  main_goal       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- Account Aggregator (spec §4, populated in Sprint 2)
  aa_consent      BOOLEAN NOT NULL DEFAULT FALSE,
  aa_linked_at    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ari_users IS 'User profiles — joined 1:1 with auth.users. Passwords live in auth.users.';

-- -----------------------------------------------------------------------------
-- accounts — bank/cash/wallet/credit (spec §4; new, not in current Flask schema)
-- -----------------------------------------------------------------------------
CREATE TABLE accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'wallet', 'credit')),
  balance        NUMERIC(12,2) NOT NULL DEFAULT 0,
  aa_account_id  TEXT,
  is_primary     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN accounts.aa_account_id IS 'Opaque Account Aggregator reference — null until user links a bank.';

-- -----------------------------------------------------------------------------
-- expenses — renamed from `transactions`. Keeps expense+income semantics from
-- current app (spec §4 table is "expenses" but we need income tracking too).
-- -----------------------------------------------------------------------------
CREATE TABLE expenses (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  account_id           UUID REFERENCES accounts(id) ON DELETE SET NULL,

  amount               NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  type                 TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  category             TEXT NOT NULL,

  -- Merchant info (spec §4)
  merchant             TEXT,                                     -- display name
  merchant_id          TEXT,                                     -- normalised MerchantDB key
  description          TEXT NOT NULL DEFAULT '',
  note                 TEXT DEFAULT '',

  -- Parse provenance (spec §4 + §5.1)
  entry_type           TEXT NOT NULL DEFAULT 'manual'
    CHECK (entry_type IN ('manual', 'voice', 'aa_sync')),
  raw_input            TEXT,
  parse_source         TEXT NOT NULL DEFAULT 'local'
    CHECK (parse_source IN ('local', 'fuzzy', 'ai', 'aa')),
  confidence           NUMERIC(3,2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),

  expense_date         DATE NOT NULL,

  -- Accountant fields (app-specific, retained from current model)
  is_recurring         BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule      TEXT CHECK (recurrence_rule IN ('monthly', 'weekly', 'biweekly', 'quarterly', 'yearly')),
  tags                 TEXT[],
  income_source        TEXT,
  parent_recurring_id  UUID REFERENCES expenses(id) ON DELETE SET NULL,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- budgets — same table name, aligned to spec §4 types
-- -----------------------------------------------------------------------------
CREATE TABLE budgets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  category       TEXT NOT NULL,
  monthly_limit  NUMERIC(12,2) NOT NULL CHECK (monthly_limit > 0),
  month          DATE NOT NULL,  -- first day of month, e.g. '2026-04-01'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category, month)
);

-- -----------------------------------------------------------------------------
-- goals — renamed from savings_goals; spec §4 uses saved_amount + status
-- -----------------------------------------------------------------------------
CREATE TABLE goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  saved_amount   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  target_date    DATE,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),

  -- UI hints (app-specific, not in spec)
  icon           TEXT DEFAULT 'flag',
  color          TEXT DEFAULT '#00C896',

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- coaching_cache — spec §4 (new). Weekly briefs, monthly reviews, anomalies.
-- -----------------------------------------------------------------------------
CREATE TABLE coaching_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('weekly_brief', 'monthly_review', 'anomaly', 'subscription_leak')),
  content       JSONB NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  model_used    TEXT,
  tokens_used   INTEGER,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_end >= period_start)
);

-- -----------------------------------------------------------------------------
-- tax_profiles — app-specific (not in spec §4, retained from current model)
-- -----------------------------------------------------------------------------
CREATE TABLE tax_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES ari_users(id) ON DELETE CASCADE,
  financial_year      TEXT NOT NULL DEFAULT '2025-26',
  regime              TEXT NOT NULL DEFAULT 'new' CHECK (regime IN ('old', 'new')),
  annual_salary       NUMERIC(12,2) NOT NULL DEFAULT 0,
  freelance_income    NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_income        NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra_received        NUMERIC(12,2) NOT NULL DEFAULT 0,
  rent_paid           NUMERIC(12,2) NOT NULL DEFAULT 0,
  metro_city          BOOLEAN NOT NULL DEFAULT TRUE,
  section_80c         NUMERIC(12,2) NOT NULL DEFAULT 0,
  section_80d         NUMERIC(12,2) NOT NULL DEFAULT 0,
  home_loan_interest  NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_deductions    NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_registered      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- budget_rollovers — app-specific (retained from current model)
-- -----------------------------------------------------------------------------
CREATE TABLE budget_rollovers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  from_month       DATE NOT NULL,
  to_month         DATE NOT NULL,
  rollover_amount  NUMERIC(12,2) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category, from_month)
);

-- -----------------------------------------------------------------------------
-- user_categories — app-specific (retained)
-- -----------------------------------------------------------------------------
CREATE TABLE user_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
  emoji       TEXT DEFAULT '📦',
  color       TEXT DEFAULT '#95A5A6',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name, type)
);

-- -----------------------------------------------------------------------------
-- todo_notes — app-specific (retained)
-- -----------------------------------------------------------------------------
CREATE TABLE todo_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT DEFAULT '',
  is_done     BOOLEAN NOT NULL DEFAULT FALSE,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date    DATE,
  due_time    TEXT,  -- HH:MM, kept as text to avoid timezone ambiguity
  color       TEXT DEFAULT '#00C896',
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- feedbacks — app-specific (retained)
-- -----------------------------------------------------------------------------
CREATE TABLE feedbacks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  rating      INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  user_email  TEXT,
  user_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- coaching_audit — spec §7: log every coaching chat query (without AI response)
-- so we can flag users who may be typing passwords/credentials.
-- -----------------------------------------------------------------------------
CREATE TABLE coaching_audit (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  query        TEXT NOT NULL,
  pii_flagged  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
