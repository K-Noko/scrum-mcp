import { z } from "zod";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const listComponentsSchema = z.object({});

export async function listComponents(_args: z.infer<typeof listComponentsSchema>) {
  const schemasPath = resolve(__dirname, "../../components/schemas.json");
  const schemas = JSON.parse(readFileSync(schemasPath, "utf-8"));
  return { components: schemas };
}
