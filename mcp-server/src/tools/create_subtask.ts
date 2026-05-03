import { z } from "zod";
import { query } from "../db/bigquery.js";
import { nanoid } from "nanoid";

export const createSubtaskSchema = z.object({
  parent_task_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  assignee_id: z.string().optional(),
});

export async function createSubtask(args: z.infer<typeof createSubtaskSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const userId = process.env.DEFAULT_USER_ID ?? "user_self";
  const now = new Date().toISOString();

  const parent = await query<{ project_id: string; sprint_id: string | null; epic_id: string | null }>(
    `SELECT project_id, sprint_id, epic_id FROM \`${dataset}.tasks\` WHERE task_id = ? LIMIT 1`,
    [args.parent_task_id]
  );
  if (parent.length === 0) throw new Error(`Parent task not found: ${args.parent_task_id}`);

  const taskId = `task_${nanoid(10)}`;
  const { project_id, sprint_id, epic_id } = parent[0];

  const columns = ["task_id", "project_id", "parent_task_id", "type", "title", "status", "created_by", "created_at", "updated_at"];
  const placeholders = ["?", "?", "?", "'subtask'", "?", "'todo'", "?", "?", "?"];
  const params: unknown[] = [taskId, project_id, args.parent_task_id, args.title, userId, now, now];

  if (sprint_id)                       { columns.push("sprint_id");   placeholders.push("?"); params.push(sprint_id); }
  if (epic_id)                         { columns.push("epic_id");     placeholders.push("?"); params.push(epic_id); }
  if (args.description !== undefined)  { columns.push("description"); placeholders.push("?"); params.push(args.description); }
  if (args.assignee_id !== undefined)  { columns.push("assignee_id"); placeholders.push("?"); params.push(args.assignee_id); }

  await query(
    `INSERT INTO \`${dataset}.tasks\` (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    params
  );

  return { task_id: taskId, parent_task_id: args.parent_task_id, title: args.title, status: "todo" };
}
