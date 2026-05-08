type AssigneeStat = { total: number; done: number; sp_total: number; sp_done: number };
type Props = { by_assignee: Record<string, AssigneeStat> };

export default function AssigneeStats({ by_assignee }: Props) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-gray-700">担当者別</h2>
      <div className="space-y-3">
        {Object.entries(by_assignee).map(([id, stat]) => {
          const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
          return (
            <div key={id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-700">{id}</span>
                <span className="text-gray-500">
                  {stat.done}/{stat.total} タスク・{stat.sp_done}/{stat.sp_total} SP
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
