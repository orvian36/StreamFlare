import { ContentRow, PosterCard } from "@streamflare/ui";
import trending from "../../fixtures/trending.json";

export function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:px-12">
      <ContentRow index="01" title="Trending on StreamFlare">
        {trending.map((t) => (
          <PosterCard key={t.title} title={t.title} subtitle={t.subtitle} imageUrl={t.image} />
        ))}
      </ContentRow>
    </section>
  );
}
