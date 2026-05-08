type Card = { label: string; value: string | number; sub?: string };
type Props = { cards: Card[] };

export default function KpiCards({ cards }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
          {card.sub && <p className="text-xs text-gray-400">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}
