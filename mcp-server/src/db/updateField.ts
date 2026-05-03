import { query } from "./bigquery.js";
import { nanoid } from "nanoid";

export async function updateTaskField(
  taskId: string,
  fieldName: string,
  newValue: string | number,
  setSql: string,
  params: unknown[]
): Promise<{ task_id: string; field: string; old_value: string | null; new_value: string }> {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const userId = process.env.DEFAULT_USER_ID ?? "user_self";
  const now = new Date().toISOString();

  const rows = await query<Record<string, unknown>>(
    `SELECT ${fieldName} FROM \`${dataset}.tasks\` WHERE task_id = ? LIMIT 1`,
    [taskId]
  );
  if (rows.length === 0) throw new Error(`Task not found: ${taskId}`);

  const oldValue = rows[0][fieldName] != null ? String(rows[0][fieldName]) : null;

  await query(
    `UPDATE \`${dataset}.tasks\` SET ${setSql}, updated_at = ? WHERE task_id = ?`,
    [...params, now, taskId]
  );

  const histColumns = ["history_id", "task_id", "changed_by", "field_name", "new_value", "changed_at"];
  const histPlaceholders = ["?", "?", "?", "?", "?", "?"];
  const histParams: unknown[] = [`hist_${nanoid(10)}`, taskId, userId, fieldName, String(newValue), now];

  if (oldValue !== null) {
    histColumns.splice(4, 0, "old_value");
    histPlaceholders.splice(4, 0, "?");
    histParams.splice(4, 0, oldValue);
  }

  await query(
    `INSERT INTO \`${dataset}.task_history\` (${histColumns.join(", ")}) VALUES (${histPlaceholders.join(", ")})`,
    histParams
  );

  return { task_id: taskId, field: fieldName, old_value: oldValue, new_value: String(newValue) };
}
