type Props = {
  name: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
};

export default function SprintHeader({ name, goal, start_date, end_date, status }: Props) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        {status && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{status}</span>
        )}
      </div>
      {goal && <p className="mt-1 text-gray-500">{goal}</p>}
      {(start_date || end_date) && (
        <div className="mt-1 text-sm text-gray-400">{start_date} 〜 {end_date}</div>
      )}
    </div>
  );
}
