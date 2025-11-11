-- Communication Safety Filters Schema
-- Detects and prevents scams, phishing, and unsafe communications

-- Safety Filter Rules (configured by admins)
CREATE TABLE IF NOT EXISTS safety_filter_rules (
  rule_id TEXT PRIMARY KEY,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'pattern', 'url', 'contact_info', 'payment_method')),
  pattern TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action TEXT NOT NULL CHECK (action IN ('warn', 'block', 'flag', 'review')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flagged Messages (messages that triggered safety rules)
CREATE TABLE IF NOT EXISTS flagged_messages (
  flag_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  rule_id TEXT NOT NULL REFERENCES safety_filter_rules(rule_id),
  matched_content TEXT,
  severity TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'false_positive', 'confirmed_unsafe', 'resolved')),
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES user_profiles(user_id)
);

-- User Safety Warnings (warnings shown to users)
CREATE TABLE IF NOT EXISTS user_safety_warnings (
  warning_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id TEXT,
  warning_type TEXT NOT NULL CHECK (warning_type IN ('suspicious_link', 'off_platform_payment', 'contact_sharing', 'scam_keywords', 'impersonation')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);

-- Blocked Content (content that was automatically blocked)
CREATE TABLE IF NOT EXISTS blocked_content (
  block_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  original_message TEXT NOT NULL,
  block_reason TEXT NOT NULL,
  rule_id TEXT NOT NULL REFERENCES safety_filter_rules(rule_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES user_profiles(user_id)
);

-- Safety Scores (track user safety reputation)
CREATE TABLE IF NOT EXISTS user_safety_scores (
  user_id TEXT PRIMARY KEY,
  safety_score INTEGER DEFAULT 100,
  warnings_count INTEGER DEFAULT 0,
  blocks_count INTEGER DEFAULT 0,
  reports_received INTEGER DEFAULT 0,
  false_positives INTEGER DEFAULT 0,
  last_incident_at TIMESTAMP,
  restricted_until TIMESTAMP,
  is_restricted BOOLEAN DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
);

-- Admin Safety Actions (log of admin interventions)
CREATE TABLE IF NOT EXISTS admin_safety_actions (
  action_id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'temporary_restriction', 'permanent_ban', 'note', 'review')),
  reason TEXT NOT NULL,
  duration_hours INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id),
  FOREIGN KEY (target_user_id) REFERENCES user_profiles(user_id)
);

-- Default Safety Filter Rules
INSERT INTO safety_filter_rules (rule_id, rule_type, pattern, severity, action, description) VALUES
  ('RULE_URL_SUSPICIOUS', 'url', '(bit\.ly|tinyurl|goo\.gl|t\.co|ow\.ly)', 'high', 'warn', 'Suspicious shortened URL detected'),
  ('RULE_OFFSITE_PAYMENT', 'keyword', '(wire transfer|western union|moneygram|gift card|bitcoin|crypto|cashapp|cash app)', 'critical', 'warn', 'Off-platform payment method mentioned'),
  ('RULE_CONTACT_PHONE', 'pattern', '\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', 'medium', 'warn', 'Phone number detected'),
  ('RULE_CONTACT_EMAIL', 'pattern', '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'medium', 'warn', 'Email address detected'),
  ('RULE_URGENT_SCAM', 'keyword', '(urgent|act now|limited time|expire|suspended account|verify account|claim prize)', 'high', 'flag', 'Urgency scam language'),
  ('RULE_IMPERSONATION', 'keyword', '(overboard support|overboard admin|customer service|technical support)', 'critical', 'flag', 'Potential platform impersonation'),
  ('RULE_PERSONAL_INFO', 'keyword', '(social security|ssn|credit card|bank account|routing number|password)', 'critical', 'block', 'Requesting sensitive personal information'),
  ('RULE_OFFSITE_DEAL', 'keyword', '(better deal|cheaper|discount|contact me directly|meet outside|skip fees)', 'high', 'warn', 'Attempting to move transaction off-platform'),
  ('RULE_FAKE_TRACKING', 'keyword', '(fake tracking|false shipment|never shipped)', 'medium', 'flag', 'Potential shipping fraud'),
  ('RULE_VENMO_PAYPAL', 'keyword', '(venmo|paypal|zelle|send money)', 'medium', 'warn', 'Direct payment app mention (use with caution)');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_flagged_messages_status ON flagged_messages(status);
CREATE INDEX IF NOT EXISTS idx_flagged_messages_sender ON flagged_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_flagged_messages_created ON flagged_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_user_safety_scores_score ON user_safety_scores(safety_score);
CREATE INDEX IF NOT EXISTS idx_user_safety_warnings_user ON user_safety_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_content_sender ON blocked_content(sender_id);
