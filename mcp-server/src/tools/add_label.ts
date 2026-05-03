import { z } from "zod";
import { query } from "../db/bigquery.js";
import { nanoid } from "nanoid";

export const addLabelSchema = z.object({
  task_id: z.string(),
  label: z.string(),
});

export async function addLabel(args: z.infer<typeof addLabelSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const userId = process.env.DEFAULT_USER_ID ?? "user_self";
  const now = new Date().toISOString();

  const rows = await query<{ labels: string[] }>(
    `SELECT labels FROM \`${dataset}.tasks\` WHERE task_id = ? LIMIT 1`,
    [args.task_id]
  );
  if (rows.length === 0) throw new Error(`Task not found: ${args.task_id}`);

  const current = rows[0].labels ?? [];
  if (current.includes(args.label)) return { task_id: args.task_id, labels: current, changed: false };

  await query(
    `UPDATE \`${dataset}.tasks\`
     SET labels = ARRAY_CONCAT(IFNULL(labels, []), [?]), updated_at = ?
     WHERE task_id = ?`,
    [args.label, now, args.task_id]
  );

  await query(
    `INSERT INTO \`${dataset}.task_history\`
       (history_id, task_id, changed_by, field_name, old_value, new_value, changed_at)
     VALUES (?, ?, ?, 'labels', ?, ?, ?)`,
    [`hist_${nanoid(10)}`, args.task_id, userId, JSON.stringify(current), JSON.stringify([...current, args.label]), now]
  );

  return { task_id: args.task_id, labels: [...current, args.label], changed: true };
}
