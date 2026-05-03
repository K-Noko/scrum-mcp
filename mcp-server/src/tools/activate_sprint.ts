import { z } from "zod";
import { query } from "../db/bigquery.js";

export const activateSprintSchema = z.object({
  sprint_id: z.string(),
});

export async function activateSprint(args: z.infer<typeof activateSprintSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const now = new Date().toISOString();

  const rows = await query<{ status: string; project_id: string }>(
    `SELECT status, project_id FROM \`${dataset}.sprints\` WHERE sprint_id = ? LIMIT 1`,
    [args.sprint_id]
  );
  if (rows.length === 0) throw new Error(`Sprint not found: ${args.sprint_id}`);
  if (rows[0].status !== "planning") throw new Error(`Sprint is already ${rows[0].status}`);

  await query(
    `UPDATE \`${dataset}.sprints\` SET status = 'active', updated_at = ? WHERE sprint_id = ?`,
    [now, args.sprint_id]
  );

  return { sprint_id: args.sprint_id, status: "active" };
}
