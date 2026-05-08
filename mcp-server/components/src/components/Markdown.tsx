type Props = { content: string };

function parse(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="mt-4 mb-1 text-base font-semibold text-gray-800">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-5 mb-2 text-lg font-bold text-gray-900">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mt-6 mb-2 text-xl font-bold text-gray-900">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700">$2</li>')
    .replace(/\n{2,}/g, '</p><p class="mb-2 text-gray-700">')
    .replace(/\n/g, "<br />");
}

export default function Markdown({ content }: Props) {
  return (
    <div
      className="rounded-xl bg-white p-4 shadow-sm text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2 text-gray-700">${parse(content)}</p>` }}
    />
  );
}
