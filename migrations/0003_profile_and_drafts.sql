CREATE TABLE IF NOT EXISTS studio_profile (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  program TEXT NOT NULL DEFAULT '',
  target_role TEXT NOT NULL DEFAULT '',
  skills TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  cv_text TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT 'pro_chaleureux',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO studio_profile (id) VALUES ('default');

ALTER TABLE applications ADD COLUMN job_description TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN draft_lm TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN draft_mail TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN draft_cv TEXT NOT NULL DEFAULT '';
