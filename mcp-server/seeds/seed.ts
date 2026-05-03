import "dotenv/config";
import { BigQuery } from "@google-cloud/bigquery";

const projectId = process.env.BIGQUERY_PROJECT_ID!;
const dataset = process.env.BIGQUERY_DATASET ?? "ticket_system";
const bq = new BigQuery({ projectId });
const ds = bq.dataset(dataset);

const now = new Date();

async function insert(table: string, rows: Record<string, unknown>[]) {
  try {
    await ds.table(table).insert(rows);
    console.log(`✓ ${table}: ${rows.length} rows inserted`);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "errors" in err) {
      const e = err as { errors: Array<{ errors: unknown[]; row: unknown }> };
      for (const item of e.errors) {
        console.error("  row:", JSON.stringify(item.row));
        console.error("  errors:", JSON.stringify(item.errors));
      }
    }
    throw err;
  }
}

async function truncateAll() {
  const tables = ["task_history", "comments", "tasks", "sprints", "epics", "projects", "users"];
  for (const table of tables) {
    await bq.query(`DELETE FROM \`${dataset}.${table}\` WHERE TRUE`);
    console.log(`  cleared ${table}`);
  }
}

async function main() {
  console.log("Truncating tables...");
  await truncateAll();

  await insert("users", [
    { user_id: "user_self", name: "自分", email: "test@example.com", role: "owner" },
    { user_id: "user_alice", name: "Alice", email: "alice@example.com", role: "member" },
    { user_id: "user_bob",   name: "Bob",   email: "bob@example.com",   role: "member" },
    { user_id: "user_carol", name: "Carol", email: "carol@example.com", role: "member" },
    { user_id: "user_dave",  name: "Dave",  email: "dave@example.com",  role: "member" },
  ]);

  await insert("projects", [
    {
      project_id: "proj_demo",
      name: "Demo Project",
      description: "Phase 1 動作確認用プロジェクト",
      created_at: now,
      updated_at: now,
    },
  ]);

  await insert("epics", [
    {
      epic_id: "epic_auth",
      project_id: "proj_demo",
      title: "認証基盤",
      description: "ログイン・権限管理の実装",
      status: "open",
      due_date: null,
      created_at: now,
      updated_at: now,
    },
    {
      epic_id: "epic_ui",
      project_id: "proj_demo",
      title: "UI整備",
      description: "Artifact可視化の実装",
      status: "open",
      due_date: null,
      created_at: now,
      updated_at: now,
    },
  ]);

  await insert("sprints", [
    {
      sprint_id: "sprint_1",
      project_id: "proj_demo",
      name: "Sprint 1",
      goal: "MCPサーバー基盤の完成",
      start_date: "2026-05-01",
      end_date:   "2026-05-14",
      status: "active",
      created_at: now,
      updated_at: now,
    },
  ]);

  await insert("tasks", [
    {
      task_id: "task_001",
      project_id: "proj_demo",
      epic_id: "epic_auth",
      sprint_id: "sprint_1",
      parent_task_id: null,
      type: "task",
      title: "BigQuery接続の確認",
      description: "ADCでBigQueryに接続できることを確認する",
      status: "done",
      priority: "high",
      assignee_id: "user_self",
      story_points: 2,
      due_date: null,
      labels: ["backend", "infra"],
      created_by: "user_self",
      created_at: now,
      updated_at: now,
    },
    {
      task_id: "task_002",
      project_id: "proj_demo",
      epic_id: "epic_auth",
      sprint_id: "sprint_1",
      parent_task_id: null,
      type: "task",
      title: "create_task ツールの実装",
      description: "MCPツールとしてcreate_taskを実装する",
      status: "in_progress",
      priority: "high",
      assignee_id: "user_alice",
      story_points: 3,
      due_date: null,
      labels: ["backend"],
      created_by: "user_self",
      created_at: now,
      updated_at: now,
    },
    {
      task_id: "task_003",
      project_id: "proj_demo",
      epic_id: "epic_ui",
      sprint_id: "sprint_1",
      parent_task_id: null,
      type: "task",
      title: "list_tasks ツールの実装",
      description: "フィルタ付きタスク一覧取得ツールを実装する",
      status: "todo",
      priority: "medium",
      assignee_id: "user_bob",
      story_points: 2,
      due_date: null,
      labels: ["backend"],
      created_by: "user_self",
      created_at: now,
      updated_at: now,
    },
  ]);

  console.log("\nSeed complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
