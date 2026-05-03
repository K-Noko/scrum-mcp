import { z } from "zod";
import { query } from "../db/bigquery.js";
import { nanoid } from "nanoid";

export const createProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export async function createProject(args: z.infer<typeof createProjectSchema>) {
  const projectId = `proj_${nanoid(10)}`;
  const now = new Date().toISOString();
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

  const columns = ["project_id", "name", "created_at", "updated_at"];
  const placeholders = ["?", "?", "?", "?"];
  const params: unknown[] = [projectId, args.name, now, now];

  if (args.description !== undefined) { columns.push("description"); placeholders.push("?"); params.push(args.description); }

  await query(
    `INSERT INTO \`${dataset}.projects\` (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    params
  );

  return { project_id: projectId, name: args.name };
}
