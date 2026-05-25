DROP TABLE IF EXISTS projects_category_migration;

CREATE TABLE projects_category_migration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO projects_category_migration (
  id, user_id, title, description, category, file_path, original_filename, file_size, created_at, updated_at
)
SELECT
  id,
  user_id,
  title,
  description,
  CASE
    WHEN category IN ('data-analytics', 'data analyst', 'analytics') THEN 'data-analytics'
    ELSE 'website'
  END,
  file_path,
  original_filename,
  file_size,
  created_at,
  updated_at
FROM projects;

DROP TABLE projects;
ALTER TABLE projects_category_migration RENAME TO projects;
