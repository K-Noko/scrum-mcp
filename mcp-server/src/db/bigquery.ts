import { BigQuery } from "@google-cloud/bigquery";
import "dotenv/config";

const projectId = process.env.BIGQUERY_PROJECT_ID;
const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";

if (!projectId) {
  throw new Error("BIGQUERY_PROJECT_ID is not set");
}

export const bq = new BigQuery({ projectId });
export const ds = bq.dataset(dataset);

function flatten(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(flatten);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // BigQuery の DATE / TIMESTAMP / NUMERIC 等は { value: "..." } 形式で返る
    if ("value" in obj && Object.keys(obj).length === 1) return obj.value;
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, flatten(v)]));
  }
  return value;
}

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await bq.query({ query: sql, params, useLegacySql: false });
  return rows.map(flatten) as T[];
}
