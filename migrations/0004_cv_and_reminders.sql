CREATE TABLE IF NOT EXISTS cv_files (
  locale TEXT PRIMARY KEY CHECK (locale IN ('fr', 'en')),
  filename TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS studio_reminders (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  last_cv_reminder_at TEXT,
  last_projects_reminder_at TEXT
);

INSERT OR IGNORE INTO studio_reminders (id) VALUES ('default');
