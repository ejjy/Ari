-- =============================================================================
-- Razorpay subscription tracking (Sprint 3).
-- ari_users.tier already exists (spec §4); this migration adds the
-- supporting columns + a history table so we can reconcile payment
-- events with our own timeline when support questions arise.
-- =============================================================================

ALTER TABLE ari_users
  ADD COLUMN razorpay_customer_id   TEXT,
  ADD COLUMN razorpay_subscription_id TEXT,
  ADD COLUMN subscription_status    TEXT NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'created', 'active', 'paused', 'halted', 'cancelled', 'expired', 'past_due')),
  ADD COLUMN tier_valid_until       TIMESTAMPTZ;

COMMENT ON COLUMN ari_users.razorpay_customer_id IS 'cust_...; created on first subscription attempt, reused thereafter.';
COMMENT ON COLUMN ari_users.razorpay_subscription_id IS 'sub_...; latest active/past subscription.';
COMMENT ON COLUMN ari_users.subscription_status IS 'Mirror of Razorpay state; kept in sync by the webhook.';

CREATE INDEX idx_ari_users_razorpay_sub ON ari_users (razorpay_subscription_id) WHERE razorpay_subscription_id IS NOT NULL;


-- History of every subscription event we receive from Razorpay. Flat
-- store, optimised for audit + replay. We NEVER mutate rows here.
CREATE TABLE subscription_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES ari_users(id) ON DELETE SET NULL,
  subscription_id TEXT NOT NULL,
  event_type      TEXT NOT NULL,          -- subscription.activated, subscription.cancelled, etc.
  razorpay_event_id TEXT,                 -- evt_...; idempotency key
  payload         JSONB NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (razorpay_event_id)
);

CREATE INDEX idx_subscription_events_user ON subscription_events (user_id, received_at DESC);
CREATE INDEX idx_subscription_events_sub ON subscription_events (subscription_id, received_at DESC);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
-- No user policies — subscription history is admin-only (readable only
-- through the service-role key). Users see their status via ari_users.
