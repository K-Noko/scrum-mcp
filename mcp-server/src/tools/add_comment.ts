import { z } from "zod";
import { query } from "../db/bigquery.js";
import { nanoid } from "nanoid";

export const addCommentSchema = z.object({
  task_id: z.string(),
  body: z.string(),
});

export async function addComment(args: z.infer<typeof addCommentSchema>) {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const userId = process.env.DEFAULT_USER_ID ?? "user_self";
  const now = new Date().toISOString();
  const commentId = `comment_${nanoid(10)}`;

  await query(
    `INSERT INTO \`${dataset}.comments\` (comment_id, task_id, author_id, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [commentId, args.task_id, userId, args.body, now, now]
  );

  return { comment_id: commentId, task_id: args.task_id, body: args.body };
}
