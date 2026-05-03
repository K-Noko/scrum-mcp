import { z } from "zod";
import { query } from "../db/bigquery.js";
import type { Task } from "../types/schema.js";

export const searchTasksSchema = z.object({
  query: z.string(),
  project_id: z.string().optional(),
});

export async function searchTasks(args: z.infer<typeof searchTasksSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const conditions: string[] = ["(CONTAINS_SUBSTR(title, ?) OR CONTAINS_SUBSTR(IFNULL(description, ''), ?))"];
  const params: unknown[] = [args.query, args.query];

  if (args.project_id) { conditions.push("project_id = ?"); params.push(args.project_id); }

  const tasks = await query<Task>(
    `SELECT * FROM \`${dataset}.tasks\`
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT 50`,
    params
  );

  return { tasks, count: tasks.length };
}
