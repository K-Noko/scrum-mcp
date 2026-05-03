import { z } from "zod";
import { updateTaskField } from "../db/updateField.js";
import { assertExists } from "../db/validate.js";

export const assignEpicSchema = z.object({
  task_id: z.string(),
  epic_id: z.string(),
});

export async function assignEpic(args: z.infer<typeof assignEpicSchema>) {
  await assertExists("epics", args.epic_id);
  return updateTaskField(args.task_id, "epic_id", args.epic_id, "epic_id = ?", [args.epic_id]);
}
