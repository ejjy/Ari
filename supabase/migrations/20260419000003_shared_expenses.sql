-- =============================================================================
-- Shared expenses + UPI deeplink settlement (Sprint 3, spec §8 DoD).
--
-- Five tables:
--   expense_groups            container ("Trip to Goa", "Roommates")
--   expense_group_members     who's in
--   expense_group_invites     short codes for joining
--   shared_expenses           who paid what
--   shared_expense_splits     who owes whom how much (per expense)
--
-- Plus ari_users.upi_vpa for the settlement deeplink.
--
-- Membership-aware RLS: group rows are visible only to current members,
-- which is fundamentally different from the per-row owner check we use
-- elsewhere. We hide the EXISTS subquery behind a SECURITY DEFINER
-- function so the policy expressions stay readable.
-- =============================================================================

ALTER TABLE ari_users ADD COLUMN upi_vpa TEXT;
COMMENT ON COLUMN ari_users.upi_vpa IS
  'UPI Virtual Payment Address (e.g. name@bank). Used to compose upi:// deeplinks when other group members settle a balance owed to this user.';


CREATE TABLE expense_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  emoji        TEXT,
  created_by   UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at  TIMESTAMPTZ
);


CREATE TABLE expense_group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at    TIMESTAMPTZ,
  UNIQUE (group_id, user_id)
);


CREATE TABLE expense_group_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  code        TEXT UNIQUE NOT NULL,        -- 8-char human-friendly
  created_by  UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_by     UUID REFERENCES ari_users(id),
  used_at     TIMESTAMPTZ
);


CREATE TABLE shared_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  paid_by       UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'other',
  expense_date  DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE shared_expense_splits (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_expense_id  UUID NOT NULL REFERENCES shared_expenses(id) ON DELETE CASCADE,
  owed_by            UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  amount             NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  settled_at         TIMESTAMPTZ,
  settlement_method  TEXT CHECK (settlement_method IS NULL OR settlement_method IN ('upi', 'cash', 'manual', 'bank')),
  UNIQUE (shared_expense_id, owed_by)
);


-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX idx_egm_user            ON expense_group_members (user_id) WHERE left_at IS NULL;
CREATE INDEX idx_egm_group           ON expense_group_members (group_id) WHERE left_at IS NULL;
CREATE INDEX idx_egi_code            ON expense_group_invites (code) WHERE used_at IS NULL;
CREATE INDEX idx_se_group_date       ON shared_expenses (group_id, expense_date DESC);
CREATE INDEX idx_se_paid_by          ON shared_expenses (paid_by);
CREATE INDEX idx_ses_owed_open       ON shared_expense_splits (owed_by) WHERE settled_at IS NULL;
CREATE INDEX idx_ses_expense         ON shared_expense_splits (shared_expense_id);


-- -----------------------------------------------------------------------------
-- RLS — membership-aware
-- -----------------------------------------------------------------------------
-- Hidden helper. SECURITY DEFINER sidesteps the recursive RLS that
-- would otherwise fire when the policy on expense_group_members tries to
-- read expense_group_members itself.
CREATE OR REPLACE FUNCTION is_group_member(gid UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM expense_group_members
     WHERE group_id = gid AND user_id = uid AND left_at IS NULL
  );
$$;

ALTER TABLE expense_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_member_groups ON expense_groups
  FOR SELECT USING (is_group_member(id, auth.uid()));
CREATE POLICY insert_own_groups ON expense_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY update_owner_groups ON expense_groups
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY delete_owner_groups ON expense_groups
  FOR DELETE USING (auth.uid() = created_by);

ALTER TABLE expense_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_members ON expense_group_members
  FOR SELECT USING (is_group_member(group_id, auth.uid()) OR auth.uid() = user_id);
-- Insert: either you're already a member adding someone else, or you're
-- inserting yourself (the join-by-invite path).
CREATE POLICY insert_members ON expense_group_members
  FOR INSERT WITH CHECK (is_group_member(group_id, auth.uid()) OR auth.uid() = user_id);
CREATE POLICY update_self_member ON expense_group_members
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE expense_group_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_invites ON expense_group_invites
  FOR SELECT USING (is_group_member(group_id, auth.uid()));
CREATE POLICY insert_invites ON expense_group_invites
  FOR INSERT WITH CHECK (is_group_member(group_id, auth.uid()) AND auth.uid() = created_by);
-- The "use an invite" flow is processed server-side via service-role,
-- so we don't need a permissive UPDATE policy.

ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_se ON shared_expenses
  FOR SELECT USING (is_group_member(group_id, auth.uid()));
CREATE POLICY insert_se ON shared_expenses
  FOR INSERT WITH CHECK (auth.uid() = paid_by AND is_group_member(group_id, auth.uid()));
CREATE POLICY update_se ON shared_expenses
  FOR UPDATE USING (auth.uid() = paid_by);
CREATE POLICY delete_se ON shared_expenses
  FOR DELETE USING (auth.uid() = paid_by);

ALTER TABLE shared_expense_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_ses ON shared_expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_expenses se
       WHERE se.id = shared_expense_id
         AND is_group_member(se.group_id, auth.uid())
    )
  );
CREATE POLICY insert_ses ON shared_expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_expenses se
       WHERE se.id = shared_expense_id AND auth.uid() = se.paid_by
    )
  );
-- Only the person who owes can mark their own split settled.
CREATE POLICY update_self_split ON shared_expense_splits
  FOR UPDATE USING (auth.uid() = owed_by);
