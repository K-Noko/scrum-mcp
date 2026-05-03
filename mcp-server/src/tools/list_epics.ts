import { z } from "zod";
import { query } from "../db/bigquery.js";
import type { Epic } from "../types/schema.js";

export const listEpicsSchema = z.object({
  project_id: z.string(),
  status: z.enum(["open", "closed"]).optional(),
});

export async function listEpics(args: z.infer<typeof listEpicsSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const conditions = ["project_id = ?"];
  const params: unknown[] = [args.project_id];

  if (args.status) { conditions.push("status = ?"); params.push(args.status); }

  const epics = await query<Epic>(
    `SELECT * FROM \`${dataset}.epics\` WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
    params
  );
  return { epics, count: epics.length };
}
