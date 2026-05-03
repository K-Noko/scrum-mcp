import { query } from "./bigquery.js";

const TABLE_PK: Record<string, string> = {
  projects: "project_id",
  epics:    "epic_id",
  sprints:  "sprint_id",
  tasks:    "task_id",
  users:    "user_id",
};

export async function assertExists(table: keyof typeof TABLE_PK, id: string): Promise<void> {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const pk = TABLE_PK[table];
  const rows = await query(
    `SELECT 1 FROM \`${dataset}.${table}\` WHERE ${pk} = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    throw new Error(`${table.slice(0, -1)} not found: ${id}`);
  }
}

export async function assertAllExist(checks: [keyof typeof TABLE_PK, string][]): Promise<void> {
  await Promise.all(checks.map(([table, id]) => assertExists(table, id)));
}
