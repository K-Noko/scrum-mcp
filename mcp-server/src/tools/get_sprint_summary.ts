import { z } from "zod";
import { query } from "../db/bigquery.js";

export const getSprintSummarySchema = z.object({
  sprint_id: z.string(),
});

export async function getSprintSummary(args: z.infer<typeof getSprintSummarySchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const [sprint] = await query<{
    sprint_id: string; name: string; goal: string | null;
    start_date: string | null; end_date: string | null; status: string;
  }>(
    `SELECT sprint_id, name, goal, start_date, end_date, status
     FROM \`${dataset}.sprints\` WHERE sprint_id = ? LIMIT 1`,
    [args.sprint_id]
  );
  if (!sprint) throw new Error(`Sprint not found: ${args.sprint_id}`);

  const tasks = await query<{
    task_id: string; title: string; status: string; priority: string | null;
    assignee_id: string | null; story_points: number | null; due_date: string | null;
  }>(
    `SELECT task_id, title, status, priority, assignee_id, story_points, due_date
     FROM \`${dataset}.tasks\` WHERE sprint_id = ? AND type = 'task'`,
    [args.sprint_id]
  );

  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const cancelled = tasks.filter(t => t.status === "cancelled").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const inReview = tasks.filter(t => t.status === "in_review").length;
  const todo = tasks.filter(t => t.status === "todo").length;

  const totalSP = tasks.reduce((s, t) => s + (t.story_points ?? 0), 0);
  const doneSP = tasks.filter(t => t.status === "done").reduce((s, t) => s + (t.story_points ?? 0), 0);

  // 担当者別集計
  const byAssignee: Record<string, { total: number; done: number; sp_total: number; sp_done: number }> = {};
  for (const t of tasks) {
    const key = t.assignee_id ?? "unassigned";
    if (!byAssignee[key]) byAssignee[key] = { total: 0, done: 0, sp_total: 0, sp_done: 0 };
    byAssignee[key].total++;
    byAssignee[key].sp_total += t.story_points ?? 0;
    if (t.status === "done") { byAssignee[key].done++; byAssignee[key].sp_done += t.story_points ?? 0; }
  }

  return {
    sprint,
    summary: { total, done, cancelled, in_progress: inProgress, in_review: inReview, todo, total_sp: totalSP, done_sp: doneSP },
    by_assignee: byAssignee,
    tasks,
  };
}
