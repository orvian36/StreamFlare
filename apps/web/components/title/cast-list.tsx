import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";

export function CastList({ cast }: { cast: { TITLE: string; NAME: string | null }[] }) {
  const named = cast.filter((c) => c.NAME);
  if (named.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-text">Cast</h2>
      <div className="flex flex-wrap gap-4">
        {named.map((c, i) => (
          <div key={`${c.NAME}-${i}`} className="flex items-center gap-2">
            <ProfileAvatar name={c.NAME!} size="sm" />
            <span className="text-sm text-text-muted">{c.NAME}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
