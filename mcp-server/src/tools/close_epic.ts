import { z } from "zod";
import { query } from "../db/bigquery.js";

export const closeEpicSchema = z.object({
  epic_id: z.string(),
});

export async function closeEpic(args: z.infer<typeof closeEpicSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const now = new Date().toISOString();

  const rows = await query<{ status: string }>(
    `SELECT status FROM \`${dataset}.epics\` WHERE epic_id = ? LIMIT 1`,
    [args.epic_id]
  );
  if (rows.length === 0) throw new Error(`Epic not found: ${args.epic_id}`);

  await query(
    `UPDATE \`${dataset}.epics\` SET status = 'closed', updated_at = ? WHERE epic_id = ?`,
    [now, args.epic_id]
  );

  return { epic_id: args.epic_id, status: "closed" };
}
