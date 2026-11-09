CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  year TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ongoing', 'paused', 'finished')),
  skills_json TEXT NOT NULL DEFAULT '[]',
  summary_fr TEXT NOT NULL DEFAULT '',
  summary_en TEXT NOT NULL DEFAULT '',
  pitch_fr TEXT NOT NULL DEFAULT '',
  pitch_en TEXT NOT NULL DEFAULT '',
  links_json TEXT NOT NULL DEFAULT '[]',
  image TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS projects_sort_idx ON projects (sort_order ASC, year DESC);
