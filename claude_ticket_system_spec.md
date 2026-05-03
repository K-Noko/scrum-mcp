# Claude-Native Ticket Management System — 仕様書

> **コンセプト**: Backlogの代替として、Claude.aiをフロントエンドに据えたチケット管理システム。  
> UIは持たず、MCPサーバー経由でClaudeが自然言語でチケットを操作する。可視化はArtifactとVercel（スプリントレポート）の2レイヤー。

---

## 1. アーキテクチャ全体像

```
Claude.ai
  │  自然言語でチケット操作
  ▼
MCP Server (Node.js / TypeScript)
  │  stdioまたはSSE（ローカル起動 or Cloud Run）
  ├─▶ BigQuery  ← メインDB（全CRUD）
  └─▶ Vercel Deploy API  ← スプリントレポートを動的生成・デプロイ
```

### 技術スタック

| レイヤー | 技術 |
|---|---|
| MCPサーバー | Node.js + TypeScript、`@modelcontextprotocol/sdk` |
| メインDB | BigQuery（Google Cloud） |
| レポートデプロイ | Vercel（Next.js App Router、API Routes経由でBQクエリ） |
| ローカル起動 | `npx tsx` / `stdio` transport |
| 本番移行時 | Cloud Run + SSE transport |

**BigQuery選定理由**: スプリントをまたいだ集計・期間フィルタ・タグ集計など分析クエリが主ユースケース。  
**CloudSQLへの切替条件**: レイテンシ < 200ms が必要なリアルタイム系操作が増えた場合に検討。

---

## 2. データモデル（BigQuery スキーマ）

### 2-1. `projects` テーブル

```sql
project_id    STRING NOT NULL,   -- PK: "proj_xxxx"
name          STRING,
description   STRING,
created_at    TIMESTAMP,
updated_at    TIMESTAMP
```

### 2-2. `epics` テーブル

```sql
epic_id       STRING NOT NULL,   -- PK: "epic_xxxx"
project_id    STRING NOT NULL,   -- FK → projects
title         STRING,
description   STRING,
status        STRING,            -- "open" | "closed"
due_date      DATE,
created_at    TIMESTAMP,
updated_at    TIMESTAMP
```

### 2-3. `sprints` テーブル

```sql
sprint_id     STRING NOT NULL,   -- PK: "sprint_xxxx"
project_id    STRING NOT NULL,
name          STRING,            -- "Sprint 1", "Sprint 2" etc.
goal          STRING,
start_date    DATE,
end_date      DATE,
status        STRING,            -- "planning" | "active" | "closed"
created_at    TIMESTAMP,
updated_at    TIMESTAMP
```

### 2-4. `tasks` テーブル（チケット本体）

```sql
task_id         STRING NOT NULL,   -- PK: "task_xxxx"
project_id      STRING NOT NULL,
epic_id         STRING,            -- nullable
sprint_id       STRING,            -- nullable
parent_task_id  STRING,            -- nullable（サブタスクの場合）
type            STRING,            -- "task" | "subtask"
title           STRING NOT NULL,
description     STRING,
status          STRING,            -- "todo" | "in_progress" | "in_review" | "done" | "cancelled"
priority        STRING,            -- "critical" | "high" | "medium" | "low"
assignee_id     STRING,            -- FK → users
story_points    INT64,
due_date        DATE,
labels          ARRAY<STRING>,
created_by      STRING,
created_at      TIMESTAMP,
updated_at      TIMESTAMP
```

### 2-5. `comments` テーブル

```sql
comment_id   STRING NOT NULL,
task_id      STRING NOT NULL,
author_id    STRING NOT NULL,
body         STRING,
created_at   TIMESTAMP,
updated_at   TIMESTAMP
```

### 2-6. `task_history` テーブル（監査ログ）

```sql
history_id    STRING NOT NULL,
task_id       STRING NOT NULL,
changed_by    STRING,
field_name    STRING,             -- "status", "assignee_id", "priority" etc.
old_value     STRING,
new_value     STRING,
changed_at    TIMESTAMP
```

### 2-7. `users` テーブル

```sql
user_id      STRING NOT NULL,
name         STRING,
email        STRING,
role         STRING              -- "owner" | "member"
```

**サンプルデータ**: 自分（owner）+ 4〜5名のダミーメンバーをシードデータとして用意する。

---

## 3. MCPツール一覧

各ツールはフィールド操作単位で細かく設計する。  
すべて `tools/` 以下に1ファイル1ツールで実装。

### 3-1. プロジェクト系

| ツール名 | 説明 | 主要パラメータ |
|---|---|---|
| `create_project` | プロジェクト作成 | `name`, `description` |
| `list_projects` | プロジェクト一覧 | — |

### 3-2. エピック系

| ツール名 | 説明 | 主要パラメータ |
|---|---|---|
| `create_epic` | エピック作成 | `project_id`, `title`, `description`, `due_date` |
| `close_epic` | エピッククローズ | `epic_id` |
| `list_epics` | エピック一覧 | `project_id`, `status?` |

### 3-3. スプリント系

| ツール名 | 説明 | 主要パラメータ |
|---|---|---|
| `create_sprint` | スプリント作成 | `project_id`, `name`, `goal`, `start_date`, `end_date` |
| `activate_sprint` | スプリント開始 | `sprint_id` |
| `close_sprint` | スプリント終了（未完タスクの扱いも返す） | `sprint_id` |
| `list_sprints` | スプリント一覧 | `project_id`, `status?` |

### 3-4. タスク・サブタスク系（チケット本体）

| ツール名 | 説明 | 主要パラメータ |
|---|---|---|
| `create_task` | タスク作成 | `project_id`, `title`, `description`, `epic_id?`, `sprint_id?`, `assignee_id?`, `priority?`, `due_date?`, `labels?`, `story_points?` |
| `create_subtask` | サブタスク作成 | `parent_task_id`, `title`, `description` |
| `get_task` | タスク詳細取得 | `task_id` |
| `list_tasks` | タスク一覧（フィルタ付き） | `project_id`, `sprint_id?`, `epic_id?`, `assignee_id?`, `status?`, `priority?`, `labels?` |
| `search_tasks` | 全文検索 | `query`, `project_id?` |
| `delete_task` | タスク削除 | `task_id` |

### 3-5. フィールド個別更新系

| ツール名 | 説明 | 主要パラメータ |
|---|---|---|
| `change_status` | ステータス変更 | `task_id`, `status` |
| `assign_ticket` | 担当者変更 | `task_id`, `assignee_id` |
| `set_priority` | 優先度変更 | `task_id`, `priority` |
| `set_due_date` | 期日変更 | `task_id`, `due_date` |
| `set_story_points` | ストーリーポイント変更 | `task_id`, `story_points` |
| `add_label` | ラベル追加 | `task_id`, `label` |
| `remove_label` | ラベル削除 | `task_id`, `label` |
| `assign_sprint` | スプリント紐付け変更 | `task_id`, `sprint_id` |
| `assign_epic` | エピック紐付け変更 | `task_id`, `epic_id` |

### 3-6. コメント系

| ツール名 | 説明 | 主要パラメータ |
|---|---|---|
| `add_comment` | コメント追加 | `task_id`, `body` |
| `list_comments` | コメント一覧 | `task_id` |

### 3-7. レポート・集計系

| ツール名 | 説明 | 主要パラメータ |
|---|---|---|
| `get_sprint_summary` | スプリントの集計サマリー取得（Artifact用） | `sprint_id` |
| `get_burndown_data` | バーンダウンチャート用データ取得 | `sprint_id` |
| `deploy_sprint_report` | スプリントレポートをVercelにデプロイ | `sprint_id`, `report_title?` |

---

## 4. Artifact可視化

Claude.aiがMCPツールから取得したデータをもとに、会話内でArtifactとして描画する。

**想定Artifact形式**:
- スプリント進捗サマリー（タスク数・SP消化率・担当者別）
- バーンダウンチャート（SVG or Reactコンポーネント）
- ラベル別タスク分布

Claudeへの指示例:
```
「現在のスプリントの進捗をArtifactで見せて」
→ get_sprint_summary → Reactコンポーネントとして描画
```

---

## 5. Vercel スプリントレポート

### 概要

`deploy_sprint_report` ツール実行時に、Next.js製のレポートページを動的生成してVercelにデプロイする。

### 実装方針

- `vercel/` ディレクトリにNext.js App Routerプロジェクトを配置
- `/report/[sprint_id]` ルートでBigQueryからデータをフェッチ（Server Component）
- デプロイはVercel Deploy API（`https://api.vercel.com/v13/deployments`）をMCPツールから呼び出し
- 生成されたURLをClaudeがユーザーに返す

### レポートコンテンツ（想定）

- スプリントゴール・期間
- 完了 / 未完了タスク一覧
- SP達成率・メンバー別消化SP
- バーンダウンチャート
- 未完了タスクの次スプリントへの持越し数

---

## 6. ディレクトリ構成

```
/
├── mcp-server/
│   ├── src/
│   │   ├── index.ts          # MCPサーバーエントリーポイント
│   │   ├── tools/            # 1ファイル1ツール
│   │   │   ├── create_task.ts
│   │   │   ├── change_status.ts
│   │   │   ├── assign_ticket.ts
│   │   │   ├── deploy_sprint_report.ts
│   │   │   └── ... (全ツール)
│   │   ├── db/
│   │   │   ├── bigquery.ts   # BigQueryクライアント初期化
│   │   │   └── queries/      # 再利用クエリ
│   │   └── types/
│   │       └── schema.ts     # 全エンティティの型定義
│   ├── seeds/
│   │   └── seed.ts           # サンプルデータ投入スクリプト
│   ├── package.json
│   └── tsconfig.json
│
├── vercel-report/
│   ├── app/
│   │   └── report/
│   │       └── [sprint_id]/
│   │           └── page.tsx  # スプリントレポートページ
│   ├── lib/
│   │   └── bigquery.ts
│   └── package.json
│
├── infra/
│   └── bigquery_schema.sql   # テーブル定義DDL
│
└── README.md
```

---

## 7. 環境変数

```env
# BigQuery
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
BIGQUERY_PROJECT_ID=your-gcp-project
BIGQUERY_DATASET=ticket_system

# Vercel
VERCEL_TOKEN=xxx
VERCEL_PROJECT_ID=xxx
VERCEL_TEAM_ID=xxx   # チームアカウントの場合

# App
DEFAULT_USER_ID=user_self   # シングルユーザー運用時の固定値
```

---

## 8. Claude.ai への接続設定（`claude_desktop_config.json`）

```json
{
  "mcpServers": {
    "ticket-system": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-server/src/index.ts"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/credentials.json",
        "BIGQUERY_PROJECT_ID": "your-gcp-project",
        "BIGQUERY_DATASET": "ticket_system"
      }
    }
  }
}
```

---

## 9. 実装フェーズ

### Phase 1 — MCPサーバー基盤 + BigQuery接続
- BigQueryスキーマ作成 & シードデータ投入
- MCPサーバーの`stdio`起動確認
- `create_task` / `change_status` / `list_tasks` の3ツールで動作確認

### Phase 2 — 全ツール実装
- フィールド個別更新ツール全実装
- コメント・履歴の書き込み
- `search_tasks` の全文検索実装（BigQuery SEARCH関数）

### Phase 3 — Artifact可視化
- `get_sprint_summary` / `get_burndown_data` の実装
- ClaudeへのArtifact描画プロンプト設計（システムプロンプトに組み込む）

### Phase 4 — Vercelスプリントレポート
- Next.jsレポートページ実装
- `deploy_sprint_report` ツール実装（Vercel Deploy API連携）
- デプロイURLの返却確認

---

## 10. 未決事項（今後詰める）

- [ ] スプリントレポートの閲覧権限（URLを知っている人なら誰でも見られるか、認証を挟むか）
- [ ] Cloud Run移行のトリガー条件（BQレイテンシ監視の閾値）
- [ ] `task_history` の自動書き込みタイミング（各更新ツール内でトリガー vs BigQuery側でのストリーム処理）
- [ ] Vercelプロジェクトの事前用意 or ツールから動的作成
