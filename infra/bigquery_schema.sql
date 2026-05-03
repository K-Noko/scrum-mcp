-- BigQuery DDL — ticket_system dataset
-- 実行前に DATASET をご自身の値に置き換えてください

CREATE TABLE IF NOT EXISTS `ticket_system.users` (
  user_id   STRING NOT NULL,
  name      STRING,
  email     STRING,
  role      STRING  -- "owner" | "member"
);

CREATE TABLE IF NOT EXISTS `ticket_system.projects` (
  project_id  STRING NOT NULL,
  name        STRING,
  description STRING,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ticket_system.epics` (
  epic_id     STRING NOT NULL,
  project_id  STRING NOT NULL,
  title       STRING,
  description STRING,
  status      STRING,   -- "open" | "closed"
  due_date    DATE,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ticket_system.sprints` (
  sprint_id   STRING NOT NULL,
  project_id  STRING NOT NULL,
  name        STRING,
  goal        STRING,
  start_date  DATE,
  end_date    DATE,
  status      STRING,   -- "planning" | "active" | "closed"
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ticket_system.tasks` (
  task_id        STRING NOT NULL,
  project_id     STRING NOT NULL,
  epic_id        STRING,
  sprint_id      STRING,
  parent_task_id STRING,
  type           STRING,   -- "task" | "subtask"
  title          STRING NOT NULL,
  description    STRING,
  status         STRING,   -- "todo" | "in_progress" | "in_review" | "done" | "cancelled"
  priority       STRING,   -- "critical" | "high" | "medium" | "low"
  assignee_id    STRING,
  story_points   INT64,
  due_date       DATE,
  labels         ARRAY<STRING>,
  created_by     STRING,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ticket_system.comments` (
  comment_id  STRING NOT NULL,
  task_id     STRING NOT NULL,
  author_id   STRING NOT NULL,
  body        STRING,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ticket_system.task_history` (
  history_id  STRING NOT NULL,
  task_id     STRING NOT NULL,
  changed_by  STRING,
  field_name  STRING,
  old_value   STRING,
  new_value   STRING,
  changed_at  TIMESTAMP
);
