export function TopTitles({ items }: { items: { title: string; views: number }[] }) {
  if (items.length === 0) {
    return <p className="text-text-muted">No titles to show yet.</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-hairline">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-1 text-text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Title</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Views</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t, i) => (
            <tr key={`${t.title}-${i}`} className="border-t border-hairline">
              <td className="px-4 py-3 text-text">{t.title}</td>
              <td className="px-4 py-3 text-right tabular-nums text-text-muted">{t.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
