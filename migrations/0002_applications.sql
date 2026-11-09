CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('todo', 'applied', 'interview', 'offer', 'rejected', 'ghosted')
  ) DEFAULT 'todo',
  channel TEXT NOT NULL CHECK (
    channel IN ('linkedin', 'website', 'email', 'referral', 'other')
  ) DEFAULT 'website',
  url TEXT,
  location TEXT,
  applied_at TEXT,
  follow_up_at TEXT,
  interview_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS applications_company_idx ON applications (company COLLATE NOCASE);
