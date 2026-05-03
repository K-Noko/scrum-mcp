import { z } from "zod";
import { updateTaskField } from "../db/updateField.js";

export const setPrioritySchema = z.object({
  task_id: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
});

export async function setPriority(args: z.infer<typeof setPrioritySchema>) {
  return updateTaskField(args.task_id, "priority", args.priority, "priority = ?", [args.priority]);
}
