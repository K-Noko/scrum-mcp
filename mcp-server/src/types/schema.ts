export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "cancelled";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskType = "task" | "subtask";
export type SprintStatus = "planning" | "active" | "closed";
export type EpicStatus = "open" | "closed";
export type UserRole = "owner" | "member";

export interface Project {
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Epic {
  epic_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: EpicStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  sprint_id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: SprintStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  task_id: string;
  project_id: string;
  epic_id: string | null;
  sprint_id: string | null;
  parent_task_id: string | null;
  type: TaskType;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  assignee_id: string | null;
  story_points: number | null;
  due_date: string | null;
  labels: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  comment_id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface TaskHistory {
  history_id: string;
  task_id: string;
  changed_by: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
}
