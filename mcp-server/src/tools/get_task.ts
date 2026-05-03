import { z } from "zod";
import { query } from "../db/bigquery.js";
import type { Task, Comment } from "../types/schema.js";

export const getTaskSchema = z.object({
  task_id: z.string(),
});

export async function getTask(args: z.infer<typeof getTaskSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const tasks = await query<Task>(
    `SELECT * FROM \`${dataset}.tasks\` WHERE task_id = ? LIMIT 1`,
    [args.task_id]
  );
  if (tasks.length === 0) throw new Error(`Task not found: ${args.task_id}`);

  const subtasks = await query<Task>(
    `SELECT * FROM \`${dataset}.tasks\` WHERE parent_task_id = ? ORDER BY created_at`,
    [args.task_id]
  );

  const comments = await query<Comment>(
    `SELECT * FROM \`${dataset}.comments\` WHERE task_id = ? ORDER BY created_at`,
    [args.task_id]
  );

  return { task: tasks[0], subtasks, comments };
}
