"use client";

import {
  Wordmark, GlowButton, GlassPanel, SectionHeader, Rating, MaturityBadge,
  GenreChip, ContentRow, PosterCard, HeroBackdrop, EmptyState, CountryCombobox,
} from "@streamflare/ui";

const SWATCHES = [
  ["canvas", "bg-canvas"], ["surface-1", "bg-surface-1"], ["surface-2", "bg-surface-2"],
  ["surface-3", "bg-surface-3"], ["brand", "bg-brand"], ["brand-2", "bg-brand-2"],
] as const;

export default function DesignSystemPage() {
  return (
    <main className="min-h-dvh bg-canvas px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl space-y-16">
        <header className="space-y-4">
          <Wordmark />
          <h1 className="font-display text-4xl font-bold tracking-tight text-text md:text-6xl">
            Aurora Noir
          </h1>
          <p className="max-w-xl text-text-muted">
            The StreamFlare design system. Cool blue-violet chrome, an indigo to cyan accent,
            geometric display type, purposeful glass and motion.
          </p>
        </header>

        <section className="space-y-4">
          <SectionHeader index="01" title="Color" />
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {SWATCHES.map(([name, bg]) => (
              <div key={name} className="space-y-2">
                <div className={`h-16 rounded-lg border border-hairline ${bg}`} />
                <p className="font-mono text-xs text-text-subtle">{name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader index="02" title="Buttons & meta" />
          <div className="flex flex-wrap items-center gap-3">
            <GlowButton>Primary</GlowButton>
            <GlowButton variant="glass">Glass</GlowButton>
            <GlowButton variant="ghost">Ghost</GlowButton>
            <Rating value={8.4} />
            <MaturityBadge rating="PG-13" />
            <GenreChip>Thriller</GenreChip>
            <div className="w-56"><CountryCombobox value="" onChange={() => {}} /></div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader index="03" title="Hero" />
          <HeroBackdrop imageUrl="/images/misc/joker1.jpg" className="rounded-2xl">
            <div className="flex min-h-72 flex-col justify-end gap-3 p-8">
              <h3 className="font-display text-3xl font-bold text-text">Joker</h3>
              <div className="flex items-center gap-3">
                <Rating value={8.4} /><MaturityBadge rating="R" /><GenreChip>Thriller</GenreChip>
              </div>
              <div className="flex gap-3"><GlowButton>Play</GlowButton><GlowButton variant="glass">More info</GlowButton></div>
            </div>
          </HeroBackdrop>
        </section>

        <ContentRow index="04" title="Content row">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <PosterCard key={n} title={`Title ${n}`} subtitle="2019 · Film" imageUrl="/images/misc/joker1.jpg" />
          ))}
        </ContentRow>

        <section className="space-y-4">
          <SectionHeader index="05" title="Empty & glass" />
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState title="Your list is empty" description="Add titles to watch later." />
            <div className="relative h-40 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-[url('/images/misc/joker1.jpg')] bg-cover bg-center" />
              <GlassPanel className="absolute inset-4 grid place-items-center">
                <p className="text-text">Glass over imagery</p>
              </GlassPanel>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
