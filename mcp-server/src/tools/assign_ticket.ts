import { z } from "zod";
import { updateTaskField } from "../db/updateField.js";
import { assertExists } from "../db/validate.js";

export const assignTicketSchema = z.object({
  task_id: z.string(),
  assignee_id: z.string(),
});

export async function assignTicket(args: z.infer<typeof assignTicketSchema>) {
  await assertExists("users", args.assignee_id);
  return updateTaskField(args.task_id, "assignee_id", args.assignee_id, "assignee_id = ?", [args.assignee_id]);
}
