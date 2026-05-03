import { z } from "zod";
import { query } from "../db/bigquery.js";
import type { Project } from "../types/schema.js";

export const listProjectsSchema = z.object({});

export async function listProjects() {
  const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
  const projects = await query<Project>(
    `SELECT * FROM \`${dataset}.projects\` ORDER BY created_at DESC`
  );
  return { projects, count: projects.length };
}
