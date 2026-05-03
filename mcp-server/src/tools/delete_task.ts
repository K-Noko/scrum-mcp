import { z } from "zod";
import { query } from "../db/bigquery.js";

export const deleteTaskSchema = z.object({
  task_id: z.string(),
});

export async function deleteTask(args: z.infer<typeof deleteTaskSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const rows = await query<{ title: string }>(
    `SELECT title FROM \`${dataset}.tasks\` WHERE task_id = ? LIMIT 1`,
    [args.task_id]
  );
  if (rows.length === 0) throw new Error(`Task not found: ${args.task_id}`);

  await query(`DELETE FROM \`${dataset}.comments\` WHERE task_id = ?`, [args.task_id]);
  await query(`DELETE FROM \`${dataset}.task_history\` WHERE task_id = ?`, [args.task_id]);
  await query(`DELETE FROM \`${dataset}.tasks\` WHERE parent_task_id = ?`, [args.task_id]);
  await query(`DELETE FROM \`${dataset}.tasks\` WHERE task_id = ?`, [args.task_id]);

  return { task_id: args.task_id, title: rows[0].title, deleted: true };
}
