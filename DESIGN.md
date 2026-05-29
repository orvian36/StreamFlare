# StreamFlare — DESIGN (Aurora Noir)

**Theme:** dark only. Scene: a viewer at night, lights low, leaning back, scanning glowing
poster art, chrome recedes and content glows.

**Color (OKLCH, hue ~274), strategy = Restrained.** Tokens live in
`packages/ui/src/styles/globals.css`:
canvas 0.16 · surfaces 0.20/0.24/0.28 · hairline 0.30 · text 0.97 / muted 0.76 / subtle 0.60 ·
brand accent indigo 0.68 0.17 274 to cyan 0.80 0.13 210 (used <10%, on focus/CTA/active/hero).
Never #000/#fff. shadcn semantic vars are aliased to these.

**Typography:** display = Sora (swap-in for Clash Display), body = Inter, mono = JetBrains
Mono. Scale 12/14/16/20/26/34/46/64, >=1.25 ratio, body 65-75ch, tabular-nums for data.

**Elevation/effects:** tinted layered shadows; accent glow on primary CTA/focus; faint grain
(`.sf-grain`) to avoid banding; glass (`GlassPanel`) only over imagery/overlays.

**Motion (Framer Motion):** fast 150 / base 250 / slow 400ms; enter ease cubic-bezier(0.16,1,0.3,1);
interactive spring (300/30); row stagger 40ms; respects prefers-reduced-motion.

**Components:** shadcn primitives in `packages/ui/src/components/ui`; bespoke primitives in
`packages/ui/src/components/brand`; all re-exported from `@streamflare/ui`. Showcase at `/design`.

**Bans:** gradient text, side-stripe borders, decorative glass, hero-metric template,
identical card grids, modal-as-first-thought, emoji icons.
