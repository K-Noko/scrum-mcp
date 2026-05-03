import { z } from "zod";
import { query } from "../db/bigquery.js";
import type { Comment } from "../types/schema.js";

export const listCommentsSchema = z.object({
  task_id: z.string(),
});

export async function listComments(args: z.infer<typeof listCommentsSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const comments = await query<Comment>(
    `SELECT * FROM \`${dataset}.comments\` WHERE task_id = ? ORDER BY created_at`,
    [args.task_id]
  );
  return { comments, count: comments.length };
}
