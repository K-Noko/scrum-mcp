import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createProjectSchema, createProject } from "./tools/create_project.js";
import { listProjectsSchema, listProjects } from "./tools/list_projects.js";
import { createEpicSchema, createEpic } from "./tools/create_epic.js";
import { closeEpicSchema, closeEpic } from "./tools/close_epic.js";
import { listEpicsSchema, listEpics } from "./tools/list_epics.js";
import { createSprintSchema, createSprint } from "./tools/create_sprint.js";
import { activateSprintSchema, activateSprint } from "./tools/activate_sprint.js";
import { closeSprintSchema, closeSprint } from "./tools/close_sprint.js";
import { listSprintsSchema, listSprints } from "./tools/list_sprints.js";
import { createTaskSchema, createTask } from "./tools/create_task.js";
import { createSubtaskSchema, createSubtask } from "./tools/create_subtask.js";
import { getTaskSchema, getTask } from "./tools/get_task.js";
import { listTasksSchema, listTasks } from "./tools/list_tasks.js";
import { searchTasksSchema, searchTasks } from "./tools/search_tasks.js";
import { deleteTaskSchema, deleteTask } from "./tools/delete_task.js";
import { changeStatusSchema, changeStatus } from "./tools/change_status.js";
import { assignTicketSchema, assignTicket } from "./tools/assign_ticket.js";
import { setPrioritySchema, setPriority } from "./tools/set_priority.js";
import { setDueDateSchema, setDueDate } from "./tools/set_due_date.js";
import { setStoryPointsSchema, setStoryPoints } from "./tools/set_story_points.js";
import { addLabelSchema, addLabel } from "./tools/add_label.js";
import { removeLabelSchema, removeLabel } from "./tools/remove_label.js";
import { assignSprintSchema, assignSprint } from "./tools/assign_sprint.js";
import { assignEpicSchema, assignEpic } from "./tools/assign_epic.js";
import { addCommentSchema, addComment } from "./tools/add_comment.js";
import { listCommentsSchema, listComments } from "./tools/list_comments.js";
import { getSprintSummarySchema, getSprintSummary } from "./tools/get_sprint_summary.js";
import { getBurndownDataSchema, getBurndownData } from "./tools/get_burndown_data.js";
import { deployPageSchema, deployPage } from "./tools/deploy_page.js";

const server = new McpServer({ name: "scrum-mcp", version: "0.2.0" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reg(name: string, description: string, schema: any, fn: (args: any) => Promise<unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.registerTool(name, { description, inputSchema: schema }, async (args: any) => ({
    content: [{ type: "text" as const, text: JSON.stringify(await fn(args), null, 2) }],
  }));
}

// プロジェクト
reg("create_project", "プロジェクトを作成する", createProjectSchema, createProject);
reg("list_projects",  "プロジェクト一覧を取得する", listProjectsSchema, listProjects);

// エピック
reg("create_epic", "エピックを作成する", createEpicSchema, createEpic);
reg("close_epic",  "エピックをクローズする", closeEpicSchema, closeEpic);
reg("list_epics",  "エピック一覧を取得する", listEpicsSchema, listEpics);

// スプリント
reg("create_sprint",   "スプリントを作成する", createSprintSchema, createSprint);
reg("activate_sprint", "スプリントを開始する", activateSprintSchema, activateSprint);
reg("close_sprint",    "スプリントを終了する（未完タスクも返す）", closeSprintSchema, closeSprint);
reg("list_sprints",    "スプリント一覧を取得する", listSprintsSchema, listSprints);

// タスク
reg("create_task",    "タスクを作成する", createTaskSchema, createTask);
reg("create_subtask", "サブタスクを作成する", createSubtaskSchema, createSubtask);
reg("get_task",       "タスク詳細・サブタスク・コメントを取得する", getTaskSchema, getTask);
reg("list_tasks",     "タスク一覧を取得する（フィルタ付き）", listTasksSchema, listTasks);
reg("search_tasks",   "タスクを全文検索する", searchTasksSchema, searchTasks);
reg("delete_task",    "タスクを削除する（サブタスク・コメント・履歴も削除）", deleteTaskSchema, deleteTask);

// フィールド更新
reg("change_status",    "タスクのステータスを変更する", changeStatusSchema, changeStatus);
reg("assign_ticket",    "タスクの担当者を変更する", assignTicketSchema, assignTicket);
reg("set_priority",     "タスクの優先度を変更する", setPrioritySchema, setPriority);
reg("set_due_date",     "タスクの期日を設定する", setDueDateSchema, setDueDate);
reg("set_story_points", "タスクのストーリーポイントを設定する", setStoryPointsSchema, setStoryPoints);
reg("add_label",        "タスクにラベルを追加する", addLabelSchema, addLabel);
reg("remove_label",     "タスクからラベルを削除する", removeLabelSchema, removeLabel);
reg("assign_sprint",    "タスクのスプリントを変更する", assignSprintSchema, assignSprint);
reg("assign_epic",      "タスクのエピックを変更する", assignEpicSchema, assignEpic);

// コメント
reg("add_comment",   "タスクにコメントを追加する", addCommentSchema, addComment);
reg("list_comments", "タスクのコメント一覧を取得する", listCommentsSchema, listComments);

// レポート・可視化
reg("get_sprint_summary", "スプリントの集計サマリー（タスク数・SP消化率・担当者別）を取得する", getSprintSummarySchema, getSprintSummary);
reg("get_burndown_data",  "バーンダウンチャート用の日別消化SPデータを取得する", getBurndownDataSchema, getBurndownData);
reg("deploy_page",        "HTMLをGCSにデプロイして公開URLを返す", deployPageSchema, deployPage);

const transport = new StdioServerTransport();
await server.connect(transport);
