import { useState, useMemo } from "react";

type Task = {
  task_id: string;
  title: string;
  status: string;
  priority: string | null;
  assignee_id: string | null;
  story_points: number | null;
  due_date: string | null;
  labels: string[];
};

type Props = { tasks: Task[]; title?: string };

const STATUS_LABEL: Record<string, string> = {
  done: "完了", in_progress: "進行中", in_review: "レビュー中", todo: "未着手", cancelled: "キャンセル",
};
const STATUS_COLOR: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-purple-100 text-purple-700",
  todo: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-400",
};
const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};
const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

type SortKey = "priority" | "status" | "due_date" | "story_points";

export default function TaskTable({ tasks, title }: Props) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("priority");

  const statuses = ["all", ...Array.from(new Set(tasks.map((t) => t.status)))];

  const filtered = useMemo(() => {
    const base = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);
    return [...base].sort((a, b) => {
      if (sortKey === "priority") return (PRIORITY_ORDER[a.priority ?? "low"] ?? 9) - (PRIORITY_ORDER[b.priority ?? "low"] ?? 9);
      if (sortKey === "due_date") return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
      if (sortKey === "story_points") return (b.story_points ?? 0) - (a.story_points ?? 0);
      return a.status.localeCompare(b.status);
    });
  }, [tasks, statusFilter, sortKey]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">{title ?? "タスク一覧"}</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "すべて" : (STATUS_LABEL[s] ?? s)}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
        >
          <option value="priority">優先度順</option>
          <option value="status">ステータス順</option>
          <option value="due_date">期日順</option>
          <option value="story_points">SP順</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} 件</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-2">タイトル</th>
              <th className="px-4 py-2">ステータス</th>
              <th className="px-4 py-2">優先度</th>
              <th className="px-4 py-2">担当者</th>
              <th className="px-4 py-2">期日</th>
              <th className="px-4 py-2 text-right">SP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.task_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <span className="text-gray-800">{t.title}</span>
                  {t.labels?.length > 0 && (
                    <div className="mt-0.5 flex gap-1">
                      {t.labels.map((l) => (
                        <span key={l} className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-500">{l}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLOR[t.status] ?? ""}`}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {t.priority && (
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLOR[t.priority] ?? ""}`}>
                      {t.priority}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-500">{t.assignee_id ?? "—"}</td>
                <td className="px-4 py-2 text-gray-500">{t.due_date ?? "—"}</td>
                <td className="px-4 py-2 text-right text-gray-500">{t.story_points ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
