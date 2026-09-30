-- Additive metadata only. Existing meetings and child records remain untouched.
CREATE TABLE IF NOT EXISTS relay_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);
