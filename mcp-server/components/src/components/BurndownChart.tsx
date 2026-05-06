type DailyDone = { date: string; sp_done: number };

type Props = {
  sprint_name: string;
  start_date: string | null;
  end_date: string | null;
  total_sp: number;
  daily_done: DailyDone[];
};

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export default function BurndownChart({ sprint_name, start_date, end_date, total_sp, daily_done }: Props) {
  if (!start_date || !end_date) {
    return <p className="p-6 text-gray-500">スプリント期間が設定されていません</p>;
  }

  const dates = dateRange(start_date, end_date);
  const doneByDate: Record<string, number> = {};
  for (const d of daily_done) doneByDate[d.date] = d.sp_done;

  // 累積消化SP（実績線）
  let cumDone = 0;
  const actual: (number | null)[] = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const d of dates) {
    if (d > today) { actual.push(null); continue; }
    cumDone += doneByDate[d] ?? 0;
    actual.push(total_sp - cumDone);
  }

  // 理想線
  const ideal = dates.map((_, i) =>
    Math.round(total_sp - (total_sp / (dates.length - 1)) * i)
  );

  const W = 600, H = 300, PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xStep = innerW / Math.max(dates.length - 1, 1);
  const yScale = (v: number) => innerH - (v / total_sp) * innerH;

  const idealPath = ideal
    .map((v, i) => `${i === 0 ? "M" : "L"}${PAD.left + i * xStep},${PAD.top + yScale(v)}`)
    .join(" ");

  const actualPoints = actual
    .map((v, i) => (v === null ? null : { x: PAD.left + i * xStep, y: PAD.top + yScale(v) }))
    .filter(Boolean) as { x: number; y: number }[];

  const actualPath = actualPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">{sprint_name} — バーンダウン</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex gap-4 text-sm">
          <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-6 bg-gray-300" /> 理想線</span>
          <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-6 bg-blue-500" /> 実績線</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Y grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => {
            const y = PAD.top + yScale(total_sp * r);
            return (
              <g key={r}>
                <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#999">
                  {Math.round(total_sp * r)}
                </text>
              </g>
            );
          })}
          {/* X labels */}
          {dates.filter((_, i) => i % Math.ceil(dates.length / 7) === 0).map((d, _, arr) => {
            const i = dates.indexOf(d);
            return (
              <text key={d} x={PAD.left + i * xStep} y={H - 10} textAnchor="middle" fontSize={10} fill="#999">
                {d.slice(5)}
              </text>
            );
          })}
          {/* Ideal line */}
          <path d={idealPath} fill="none" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="4 3" />
          {/* Actual line */}
          {actualPath && <path d={actualPath} fill="none" stroke="#3b82f6" strokeWidth={2} />}
          {/* Actual dots */}
          {actualPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
          ))}
        </svg>
        <div className="mt-2 text-center text-xs text-gray-400">
          総SP: {total_sp}　消化済み: {cumDone}　残: {total_sp - cumDone}
        </div>
      </div>
    </div>
  );
}
