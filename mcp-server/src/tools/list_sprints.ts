import { z } from "zod";
import { query } from "../db/bigquery.js";
import type { Sprint } from "../types/schema.js";

export const listSprintsSchema = z.object({
  project_id: z.string(),
  status: z.enum(["planning", "active", "closed"]).optional(),
});

export async function listSprints(args: z.infer<typeof listSprintsSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const conditions = ["project_id = ?"];
  const params: unknown[] = [args.project_id];

  if (args.status) { conditions.push("status = ?"); params.push(args.status); }

  const sprints = await query<Sprint>(
    `SELECT * FROM \`${dataset}.sprints\` WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
    params
  );
  return { sprints, count: sprints.length };
}
