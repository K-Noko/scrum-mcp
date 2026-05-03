# scrum-mcp — Claude 向けコードベース案内

## 概要
Claude.ai をフロントエンドとするチケット管理システムプロトタイプの MCP サーバー。
BigQuery をメイン DB、GCS をレポートデプロイ先として使う。
※実用化に向けては認証周りを中心に課題があり解決模索中

## 重要な実装規約

### BigQuery パラメータ

- SQL パラメータは **必ず位置指定 `?`** を使う（名前付き `@param` は不可）
- `null` をパラメータとして渡してはいけない（BigQuery が型エラーを返す）
- 空配列 `[]` もパラメータとして渡してはいけない（同上）
- → optional フィールドは値がある場合のみ INSERT 列に含める動的 INSERT パターンで対応

```typescript
// NG
await query(`INSERT INTO t (a, b) VALUES (?, ?)`, [value, null]);

// OK
const columns = ["a"];
const params: unknown[] = [value];
if (optionalValue !== undefined) { columns.push("b"); params.push(optionalValue); }
await query(`INSERT INTO t (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`, params);
```

### DATE / TIMESTAMP の扱い

- seed スクリプトで DATE 型に渡す値は `"YYYY-MM-DD"` のプレーン文字列（`{ value: "..." }` オブジェクトは不可）
- `query()` の戻り値は `flatten()` で自動的にプレーン値に変換済み（`{ value: "2026-05-01" }` → `"2026-05-01"`）

### ツールの追加手順

1. `src/tools/ツール名.ts` を作成（スキーマ export + 実装関数 export）
2. `src/index.ts` に import と `reg()` 呼び出しを追加

### フィールド更新系ツール

`assign_ticket` / `set_priority` など単一フィールド更新は `src/db/updateField.ts` の `updateTaskField()` を使う。
これが UPDATE + `task_history` への履歴書き込みをまとめて行う。

### 全文検索

`SEARCH()` 関数はインデックスが必要なため未使用。`CONTAINS_SUBSTR()` で代替している。

## ディレクトリ構成

```
mcp-server/src/
├── index.ts          # サーバーエントリ・全ツール登録
├── db/
│   ├── bigquery.ts   # BQ クライアント・query()・flatten()
│   └── updateField.ts
├── tools/            # 1 ファイル 1 ツール（動詞_名詞 命名）
└── types/schema.ts   # 全エンティティの TypeScript 型
```

## 環境変数

| 変数 | 用途 |
|---|---|
| `BIGQUERY_PROJECT_ID` | GCP プロジェクト ID |
| `BIGQUERY_DATASET` | BQ データセット名 |
| `GCS_BUCKET` | レポート HTML デプロイ先バケット |
| `DEFAULT_USER_ID` | 操作ユーザーの固定 ID |

## 残課題

### レポート HTML の品質向上
**あまりにフロントエンドに機能を持たせると劣化Backlogになるため、レポートからブレないようにを意識したい**
- **CSS 分離**: スタイルをインライン埋め込みではなく独立した CSS として管理し、
  Claude が HTML 生成時に参照できる形にする（GCS に置いた共通 CSS を `<link>` で読み込む等）
- **Alpine.js または vanilla JS による簡易インタラクション**: GCS デプロイ後の静的 HTML 上で
  フィルタ・ソートが動くようにする（サーバーサイド不要、テーブル行を表示/非表示・並び替えする程度）
  → `deploy_page` で生成する HTML のボイラープレートに含める方針

### データ・ロジック
- `get_burndown_data` は `task_history` の `status → done` 変更時刻を使う設計のため、
  手動で history を作成していないタスクはバーンダウンに反映されない
- `users` テーブルと `assignee_id` の JOIN（現状は ID がそのまま返る）
- 操作者識別の欠如：現状は `DEFAULT_USER_ID` 固定値で全操作が同一ユーザーとして記録されるため、`created_by` / `changed_by` が常に一意になる。本来は「リクエストを送ってきた操作者」を MCP サーバーが把握した上で DML に詰める必要があり、認証基盤と密結合になる。
  - gcloud authの認証がローカルで通っていることを動作前提としているので、そこからユーザー情報を取得することは可能かもしれない。

### インフラ

**認証 - MCPサーバー側**  
現状はローカル stdio 起動のためアクセス制御なし。
本番化する場合CloudRunへのデプロイ想定だが、下記の2つの論点を解決する必要あり
- Claude.ai → MCPサーバー：CloudRunのIAPをClaude Desktopからのリクエストが通過できるための実装が未調査。
- Googleアカウント認証情報の取得：監査観点からサービスアカウントではなく操作者本人のGoogleアカウントとして動作する形が望ましい。認証情報の受け渡しをどのようにして行うか。
→こちらはMCP経由でのOAuth認証の仕組みがClaude Desktopから整うまではローカルでサーバーを立てる可能性大

**認証 - レポートHTMLデプロイ先**
本番化する場合は Cloud Run へ移行し、以下いずれかで認証を導入する：
- **認証サイドカー付きデプロイ**: Cloud Run サービスに認証プロキシコンテナを併置し、SSE エンドポイントへの直接アクセスを遮断
- **IAP（Identity-Aware Proxy）有効**: Cloud Run は LB なしで IAP を直接有効化できる。Google アカウントベースのアクセス制御をシンプルに導入可能。参考: https://cloud.google.com/iap/docs/enabling-cloud-run

**Cloud SQL 移行**  
BQ レイテンシ < 200ms が必要なリアルタイム操作が増えた場合に検討。  
移行方針：
- Cloud SQL（PostgreSQL）をメイン DB に切り替え
- BigQuery との同期は **Datastream**（CDC）経由で維持し、集計・レポート系クエリは引き続き BQ で実行する構成が有効
