import { z } from "zod";
import { query } from "../db/bigquery.js";
import { assertExists } from "../db/validate.js";
import { nanoid } from "nanoid";

export const createSprintSchema = z.object({
  project_id: z.string(),
  name: z.string(),
  goal: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export async function createSprint(args: z.infer<typeof createSprintSchema>) {
  await assertExists("projects", args.project_id);
  const sprintId = `sprint_${nanoid(10)}`;
  const now = new Date().toISOString();
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const columns = ["sprint_id", "project_id", "name", "status", "created_at", "updated_at"];
  const placeholders = ["?", "?", "?", "'planning'", "?", "?"];
  const params: unknown[] = [sprintId, args.project_id, args.name, now, now];

  if (args.goal !== undefined)       { columns.push("goal");       placeholders.push("?"); params.push(args.goal); }
  if (args.start_date !== undefined) { columns.push("start_date"); placeholders.push("?"); params.push(args.start_date); }
  if (args.end_date !== undefined)   { columns.push("end_date");   placeholders.push("?"); params.push(args.end_date); }

  await query(
    `INSERT INTO \`${dataset}.sprints\` (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    params
  );

  return { sprint_id: sprintId, name: args.name, status: "planning" };
}
