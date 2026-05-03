import { z } from "zod";
import { updateTaskField } from "../db/updateField.js";
import { assertExists } from "../db/validate.js";

export const assignSprintSchema = z.object({
  task_id: z.string(),
  sprint_id: z.string(),
});

export async function assignSprint(args: z.infer<typeof assignSprintSchema>) {
  await assertExists("sprints", args.sprint_id);
  return updateTaskField(args.task_id, "sprint_id", args.sprint_id, "sprint_id = ?", [args.sprint_id]);
}
