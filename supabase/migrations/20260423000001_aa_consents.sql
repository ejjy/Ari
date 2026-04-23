-- =============================================================================
-- Account Aggregator consents (spec §2 AA row).
--
-- One row per user×bank-link. Tracks the Setu consent handle through its
-- lifecycle PENDING -> ACTIVE -> REVOKED/EXPIRED, plus the latest FI
-- session id so we can resume polling without losing state across deploys.
-- =============================================================================

CREATE TABLE aa_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  consent_handle  TEXT UNIQUE NOT NULL,
  consent_id      TEXT,
  status          TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACTIVE', 'REVOKED', 'PAUSED', 'EXPIRED', 'REJECTED', 'FAILED')),
  redirect_url    TEXT,
  fi_session_id   TEXT,
  fi_types        TEXT[] DEFAULT ARRAY['DEPOSIT'],
  last_fetched_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

CREATE INDEX idx_aa_consents_user ON aa_consents (user_id, created_at DESC);
CREATE INDEX idx_aa_consents_handle ON aa_consents (consent_handle);

CREATE TRIGGER aa_consents_touch_updated_at
  BEFORE UPDATE ON aa_consents
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE aa_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_aa_consents ON aa_consents
  FOR SELECT USING (auth.uid() = user_id);
-- No insert/update/delete from client — the Setu webhook is the only
-- authority for state changes; routes use service-role to write.
