# scrum-mcp

Claude.ai をフロントエンドとするチケット管理システムのプロトタイプ。  
UI を持たず、MCP サーバー経由で Claude が自然言語でチケットを操作する。
※実用化に向けては認証周りを中心に課題があり解決模索中


## コンセプト

**MCPサーバーを繋いだClaudeをハブにして、UIレスで仕事をする - チケット管理編**
- カンバンボードを持たず、課題の状況はClaudeに聞く
  - 視覚的に確認が必要なら、Claudeに頼んでClaude上でアーティファクト化
- 課題のステータス変更も、アクションが終わったときにClaudeに頼む
  - その「アクション」もMCP化してClaudeから動かせるならさらにおいしい
- スプリントまとめはHTMLの簡易レポートを作成して、公開URLから確認できる

## アーキテクチャ

```
Claude.ai
  │  自然言語でチケット操作
  ▼
MCP Server (Node.js / TypeScript)
  ├─▶ BigQuery  ← メイン DB（全 CRUD）
  └─▶ GCS       ← Claude 生成レポートのデプロイ先
```

## セットアップ

### 前提

- Node.js v22+
- Google Cloud SDK（`gcloud auth application-default login` 済み）
- BigQuery データセット作成済み
- GCS バケット作成済み（公開アクセス許可設定済み）

### 1. 依存インストール

```sh
cd mcp-server
npm install
```

### 2. 環境変数

```sh
cp .env.example .env
# .env を編集して各値を設定
```

| 変数 | 説明 |
|---|---|
| `BIGQUERY_PROJECT_ID` | GCP プロジェクト ID |
| `BIGQUERY_DATASET` | BigQuery データセット名（デフォルト: `ticket_system`） |
| `GCS_BUCKET` | レポートデプロイ先バケット名 |
| `DEFAULT_USER_ID` | シングルユーザー運用時の固定 user_id |

### 3. BigQuery テーブル作成

```sh
bq query --project_id=YOUR_PROJECT --use_legacy_sql=false < infra/bigquery_schema.sql
```

### 4. GCS バケット 公開設定

```sh
gcloud storage buckets update gs://YOUR_BUCKET --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET \
  --member=allUsers --role=roles/storage.objectViewer
```

### 5. シードデータ投入

```sh
npm run seed
```

### 6. Claude Desktop 接続設定

`claude_desktop_config.json` に追加：

```json
{
  "mcpServers": {
    "scrum-mcp": {
      "command": "C:/path/to/scrum-mcp/mcp-server/start.bat"
    }
  }
}
```

## MCP ツール一覧

### プロジェクト
| ツール | 説明 |
|---|---|
| `create_project` | プロジェクト作成 |
| `list_projects` | プロジェクト一覧 |

### エピック
| ツール | 説明 |
|---|---|
| `create_epic` | エピック作成 |
| `close_epic` | エピッククローズ |
| `list_epics` | エピック一覧 |

### スプリント
| ツール | 説明 |
|---|---|
| `create_sprint` | スプリント作成 |
| `activate_sprint` | スプリント開始 |
| `close_sprint` | スプリント終了（未完タスク一覧も返す） |
| `list_sprints` | スプリント一覧 |

### タスク
| ツール | 説明 |
|---|---|
| `create_task` | タスク作成 |
| `create_subtask` | サブタスク作成（親タスクのスプリント・エピックを継承） |
| `get_task` | タスク詳細・サブタスク・コメント取得 |
| `list_tasks` | タスク一覧（スプリント・担当者・ステータス等でフィルタ） |
| `search_tasks` | タイトル・説明文の全文検索 |
| `delete_task` | タスク削除（サブタスク・コメント・履歴も削除） |

### フィールド更新
| ツール | 説明 |
|---|---|
| `change_status` | ステータス変更（履歴記録あり） |
| `assign_ticket` | 担当者変更 |
| `set_priority` | 優先度変更 |
| `set_due_date` | 期日設定 |
| `set_story_points` | ストーリーポイント設定 |
| `add_label` | ラベル追加 |
| `remove_label` | ラベル削除 |
| `assign_sprint` | スプリント紐付け変更 |
| `assign_epic` | エピック紐付け変更 |

### コメント
| ツール | 説明 |
|---|---|
| `add_comment` | コメント追加 |
| `list_comments` | コメント一覧 |

### レポート
| ツール | 説明 |
|---|---|
| `get_sprint_summary` | スプリント集計（タスク数・SP消化率・担当者別） |
| `get_burndown_data` | バーンダウン用日別消化 SP データ |
| `deploy_page` | Claude 生成 HTML を GCS にデプロイして公開 URL を返す |

## ディレクトリ構成

```
mcp-server/
├── src/
│   ├── index.ts          # MCP サーバーエントリ（stdio）
│   ├── db/
│   │   ├── bigquery.ts   # BQ クライアント・query() ヘルパー
│   │   ├── updateField.ts # フィールド更新 + 履歴書き込みヘルパー
│   │   └── validate.ts   # FK 存在チェックヘルパー（assertExists / assertAllExist）
│   ├── tools/            # 1 ファイル 1 ツール
│   └── types/schema.ts   # 全エンティティ型定義
├── seeds/seed.ts         # サンプルデータ投入
├── start.bat             # Claude Desktop 用ラッパー
└── .env.example
infra/bigquery_schema.sql # DDL
```
