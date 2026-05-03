import { z } from "zod";
import { query } from "../db/bigquery.js";

export const closeSprintSchema = z.object({
  sprint_id: z.string(),
});

export async function closeSprint(args: z.infer<typeof closeSprintSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const now = new Date().toISOString();

  const rows = await query<{ status: string }>(
    `SELECT status FROM \`${dataset}.sprints\` WHERE sprint_id = ? LIMIT 1`,
    [args.sprint_id]
  );
  if (rows.length === 0) throw new Error(`Sprint not found: ${args.sprint_id}`);
  if (rows[0].status === "closed") throw new Error("Sprint is already closed");

  await query(
    `UPDATE \`${dataset}.sprints\` SET status = 'closed', updated_at = ? WHERE sprint_id = ?`,
    [now, args.sprint_id]
  );

  const incomplete = await query<{ task_id: string; title: string }>(
    `SELECT task_id, title FROM \`${dataset}.tasks\`
     WHERE sprint_id = ? AND status NOT IN ('done', 'cancelled')`,
    [args.sprint_id]
  );

  return {
    sprint_id: args.sprint_id,
    status: "closed",
    incomplete_tasks: incomplete,
    incomplete_count: incomplete.length,
  };
}
