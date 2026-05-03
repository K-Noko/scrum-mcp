import { z } from "zod";
import { query } from "../db/bigquery.js";
import { assertExists } from "../db/validate.js";
import { nanoid } from "nanoid";

export const createEpicSchema = z.object({
  project_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  due_date: z.string().optional(),
});

export async function createEpic(args: z.infer<typeof createEpicSchema>) {
  await assertExists("projects", args.project_id);
  const epicId = `epic_${nanoid(10)}`;
  const now = new Date().toISOString();
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const columns = ["epic_id", "project_id", "title", "status", "created_at", "updated_at"];
  const placeholders = ["?", "?", "?", "'open'", "?", "?"];
  const params: unknown[] = [epicId, args.project_id, args.title, now, now];

  if (args.description !== undefined) { columns.push("description"); placeholders.push("?"); params.push(args.description); }
  if (args.due_date !== undefined)    { columns.push("due_date");    placeholders.push("?"); params.push(args.due_date); }

  await query(
    `INSERT INTO \`${dataset}.epics\` (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    params
  );

  return { epic_id: epicId, title: args.title, status: "open" };
}
