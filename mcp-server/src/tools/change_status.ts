import { z } from "zod";
import { query } from "../db/bigquery.js";
import { nanoid } from "nanoid";

export const changeStatusSchema = z.object({
  task_id: z.string(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "cancelled"]),
});

export async function changeStatus(args: z.infer<typeof changeStatusSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const userId = process.env.DEFAULT_USER_ID ?? "user_self";
  const now = new Date().toISOString();

  const rows = await query<{ status: string }>(
    `SELECT status FROM \`${dataset}.tasks\` WHERE task_id = ? LIMIT 1`,
    [args.task_id]
  );

  if (rows.length === 0) {
    throw new Error(`Task not found: ${args.task_id}`);
  }

  const oldStatus = rows[0].status;

  await query(`
    UPDATE \`${dataset}.tasks\`
    SET status = ?, updated_at = ?
    WHERE task_id = ?
  `, [args.status, now, args.task_id]);

  await query(`
    INSERT INTO \`${dataset}.task_history\`
      (history_id, task_id, changed_by, field_name, old_value, new_value, changed_at)
    VALUES
      (?, ?, ?, 'status', ?, ?, ?)
  `, [
    `hist_${nanoid(10)}`,
    args.task_id,
    userId,
    oldStatus,
    args.status,
    now,
  ]);

  return { task_id: args.task_id, old_status: oldStatus, new_status: args.status };
}
