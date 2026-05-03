import { z } from "zod";
import { updateTaskField } from "../db/updateField.js";

export const setDueDateSchema = z.object({
  task_id: z.string(),
  due_date: z.string(),
});

export async function setDueDate(args: z.infer<typeof setDueDateSchema>) {
  return updateTaskField(args.task_id, "due_date", args.due_date, "due_date = ?", [args.due_date]);
}
