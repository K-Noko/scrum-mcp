import { z } from "zod";
import { updateTaskField } from "../db/updateField.js";

export const setStoryPointsSchema = z.object({
  task_id: z.string(),
  story_points: z.number().int().min(0),
});

export async function setStoryPoints(args: z.infer<typeof setStoryPointsSchema>) {
  return updateTaskField(args.task_id, "story_points", args.story_points, "story_points = ?", [args.story_points]);
}
