"use client";

import { useReducedMotion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Overview } from "../../lib/admin-data";

// Aurora --chart-1..5 token values. recharts sets the SVG `fill` attribute, which does NOT
// resolve CSS var(); these literals mirror the tokens in packages/ui/src/styles/globals.css.
const CHART = ["oklch(0.68 0.170 274)", "oklch(0.80 0.130 210)", "oklch(0.72 0.150 155)", "oklch(0.74 0.150 320)", "oklch(0.80 0.130 85)"];
const GRID = "oklch(0.30 0.018 274)";
const AXIS = "oklch(0.60 0.012 274)";
const TOOLTIP = { background: "oklch(0.20 0.018 274)", border: `1px solid ${GRID}`, borderRadius: 10, color: "oklch(0.97 0.005 274)" };
const CURSOR = { fill: "oklch(0.24 0.020 274 / 0.4)" };

export function AnalyticsCharts({ overview }: { overview: Overview }) {
  const reduce = useReducedMotion();
  const animate = !reduce;
  const trending = overview.trending.map((t) => ({ name: t.title, views: t.views }));
  const genres = overview.genres.map((g) => ({ name: g.name, count: g.count }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-hairline bg-surface-1 p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text">Trending by views</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trending} margin={{ left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} hide />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP} cursor={CURSOR} />
              <Bar dataKey="views" fill={CHART[0]} radius={[4, 4, 0, 0]} isAnimationActive={animate} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-xl border border-hairline bg-surface-1 p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text">Titles by genre</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={genres} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} width={80} />
              <Tooltip contentStyle={TOOLTIP} cursor={CURSOR} />
              <Bar dataKey="count" fill={CHART[1]} radius={[0, 4, 4, 0]} isAnimationActive={animate} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
