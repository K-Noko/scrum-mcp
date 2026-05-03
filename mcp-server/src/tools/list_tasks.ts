import { z } from "zod";
import { query } from "../db/bigquery.js";
import type { Task } from "../types/schema.js";

export const listTasksSchema = z.object({
  project_id: z.string(),
  sprint_id: z.string().optional(),
  epic_id: z.string().optional(),
  assignee_id: z.string().optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done", "cancelled"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  labels: z.array(z.string()).optional(),
});

export async function listTasks(args: z.infer<typeof listTasksSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const conditions: string[] = ["project_id = ?"];
  const params: unknown[] = [args.project_id];

  if (args.sprint_id)   { conditions.push("sprint_id = ?");    params.push(args.sprint_id); }
  if (args.epic_id)     { conditions.push("epic_id = ?");      params.push(args.epic_id); }
  if (args.assignee_id) { conditions.push("assignee_id = ?");  params.push(args.assignee_id); }
  if (args.status)      { conditions.push("status = ?");       params.push(args.status); }
  if (args.priority)    { conditions.push("priority = ?");     params.push(args.priority); }
  if (args.labels && args.labels.length > 0) {
    conditions.push("EXISTS (SELECT 1 FROM UNNEST(labels) l WHERE l IN UNNEST(?))");
    params.push(args.labels);
  }

  const sql = `
    SELECT * FROM \`${dataset}.tasks\`
    WHERE ${conditions.join(" AND ")}
    ORDER BY
      CASE priority
        WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4
        ELSE 5
      END,
      created_at DESC
    LIMIT 200
  `;

  const tasks = await query<Task>(sql, params);
  return { tasks, count: tasks.length };
}
