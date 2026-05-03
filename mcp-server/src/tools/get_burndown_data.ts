import { z } from "zod";
import { query } from "../db/bigquery.js";

export const getBurndownDataSchema = z.object({
  sprint_id: z.string(),
});

export async function getBurndownData(args: z.infer<typeof getBurndownDataSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const [sprint] = await query<{
    name: string; start_date: { value: string } | null; end_date: { value: string } | null; status: string;
  }>(
    `SELECT name, start_date, end_date, status FROM \`${dataset}.sprints\` WHERE sprint_id = ? LIMIT 1`,
    [args.sprint_id]
  );
  if (!sprint) throw new Error(`Sprint not found: ${args.sprint_id}`);

  const totalSP = await query<{ total: number }>(
    `SELECT IFNULL(SUM(story_points), 0) AS total
     FROM \`${dataset}.tasks\` WHERE sprint_id = ? AND type = 'task'`,
    [args.sprint_id]
  );

  // done になった日ごとの消化SP（task_history から）
  const burndown = await query<{ date: string; sp_done: number }>(
    `SELECT
       DATE(h.changed_at) AS date,
       SUM(IFNULL(t.story_points, 0)) AS sp_done
     FROM \`${dataset}.task_history\` h
     JOIN \`${dataset}.tasks\` t ON h.task_id = t.task_id
     WHERE h.task_id IN (
       SELECT task_id FROM \`${dataset}.tasks\` WHERE sprint_id = ? AND type = 'task'
     )
     AND h.field_name = 'status'
     AND h.new_value = 'done'
     GROUP BY date
     ORDER BY date`,
    [args.sprint_id]
  );

  return {
    sprint_name: sprint.name,
    start_date: sprint.start_date,
    end_date: sprint.end_date,
    total_sp: totalSP[0]?.total ?? 0,
    daily_done: burndown,
  };
}
