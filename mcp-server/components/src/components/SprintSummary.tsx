type Task = {
  task_id: string;
  title: string;
  status: string;
  priority: string | null;
  assignee_id: string | null;
  story_points: number | null;
};

type Sprint = {
  sprint_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

type Summary = {
  total: number;
  done: number;
  in_progress: number;
  in_review: number;
  todo: number;
  cancelled: number;
  total_sp: number;
  done_sp: number;
};

type AssigneeStat = { total: number; done: number; sp_total: number; sp_done: number };

type Props = {
  sprint: Sprint;
  summary: Summary;
  by_assignee: Record<string, AssigneeStat>;
  tasks: Task[];
};

const STATUS_LABEL: Record<string, string> = {
  done: "完了", in_progress: "進行中", in_review: "レビュー中", todo: "未着手", cancelled: "キャンセル",
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export default function SprintSummary({ sprint, summary, by_assignee, tasks }: Props) {
  const completion = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;
  const spCompletion = summary.total_sp > 0 ? Math.round((summary.done_sp / summary.total_sp) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{sprint.name}</h1>
        {sprint.goal && <p className="mt-1 text-gray-500">{sprint.goal}</p>}
        <div className="mt-1 text-sm text-gray-400">
          {sprint.start_date} 〜 {sprint.end_date}
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "タスク完了率", value: `${completion}%`, sub: `${summary.done} / ${summary.total}` },
          { label: "SP 消化率", value: `${spCompletion}%`, sub: `${summary.done_sp} / ${summary.total_sp} SP` },
          { label: "進行中", value: summary.in_progress + summary.in_review, sub: "タスク" },
          { label: "未着手", value: summary.todo, sub: "タスク" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-600">全体進捗</span>
          <span className="font-medium">{completion}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200">
          <div className="h-3 rounded-full bg-green-500" style={{ width: `${completion}%` }} />
        </div>
      </div>

      {/* By assignee */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-700">担当者別</h2>
        <div className="space-y-3">
          {Object.entries(by_assignee).map(([id, stat]) => {
            const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
            return (
              <div key={id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-700">{id}</span>
                  <span className="text-gray-500">{stat.done}/{stat.total} タスク・{stat.sp_done}/{stat.sp_total} SP</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 font-semibold text-gray-700">タスク一覧</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-2">タイトル</th>
              <th className="px-4 py-2">ステータス</th>
              <th className="px-4 py-2">優先度</th>
              <th className="px-4 py-2">担当者</th>
              <th className="px-4 py-2 text-right">SP</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.task_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-800">{t.title}</td>
                <td className="px-4 py-2 text-gray-500">{STATUS_LABEL[t.status] ?? t.status}</td>
                <td className="px-4 py-2">
                  {t.priority && (
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLOR[t.priority] ?? ""}`}>
                      {t.priority}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-500">{t.assignee_id ?? "—"}</td>
                <td className="px-4 py-2 text-right text-gray-500">{t.story_points ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
