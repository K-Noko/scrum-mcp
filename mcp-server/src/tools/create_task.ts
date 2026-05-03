import { z } from "zod";
import { query } from "../db/bigquery.js";
import { assertAllExist } from "../db/validate.js";
import { nanoid } from "nanoid";

export const createTaskSchema = z.object({
  project_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  epic_id: z.string().optional(),
  sprint_id: z.string().optional(),
  assignee_id: z.string().optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  due_date: z.string().optional(),
  labels: z.array(z.string()).optional(),
  story_points: z.number().int().optional(),
});

export async function createTask(args: z.infer<typeof createTaskSchema>) {
  const checks: ["projects" | "epics" | "sprints" | "users", string][] = [["projects", args.project_id]];
  if (args.epic_id)     checks.push(["epics",   args.epic_id]);
  if (args.sprint_id)   checks.push(["sprints",  args.sprint_id]);
  if (args.assignee_id) checks.push(["users",    args.assignee_id]);
  await assertAllExist(checks);

  const taskId = `task_${nanoid(10)}`;
  const now = new Date().toISOString();
  const userId = process.env.DEFAULT_USER_ID ?? "user_self";
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const columns = ["task_id", "project_id", "type", "title", "status", "created_by", "created_at", "updated_at"];
  const placeholders = ["?", "?", "'task'", "?", "'todo'", "?", "?", "?"];
  const params: unknown[] = [taskId, args.project_id, args.title, userId, now, now];

  if (args.description !== undefined)   { columns.push("description");  placeholders.push("?"); params.push(args.description); }
  if (args.labels && args.labels.length > 0) { columns.push("labels"); placeholders.push("?"); params.push(args.labels); }
  if (args.epic_id !== undefined)      { columns.push("epic_id");      placeholders.push("?"); params.push(args.epic_id); }
  if (args.sprint_id !== undefined)    { columns.push("sprint_id");    placeholders.push("?"); params.push(args.sprint_id); }
  if (args.assignee_id !== undefined)  { columns.push("assignee_id");  placeholders.push("?"); params.push(args.assignee_id); }
  if (args.priority !== undefined)     { columns.push("priority");     placeholders.push("?"); params.push(args.priority); }
  if (args.story_points !== undefined) { columns.push("story_points"); placeholders.push("?"); params.push(args.story_points); }
  if (args.due_date !== undefined)     { columns.push("due_date");     placeholders.push("?"); params.push(args.due_date); }

  await query(`
    INSERT INTO \`${dataset}.tasks\` (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
  `, params);

  return { task_id: taskId, title: args.title, status: "todo" };
}
