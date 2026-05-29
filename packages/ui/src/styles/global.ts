import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    /* Color: cool tinted neutrals (hue 265), never #000/#fff, never Netflix red */
    --sf-canvas: oklch(0.17 0.012 265);
    --sf-surface-1: oklch(0.21 0.014 265);
    --sf-surface-2: oklch(0.26 0.016 265);
    --sf-line: oklch(0.40 0.012 265);
    --sf-line-strong: oklch(0.62 0.012 265);
    --sf-text: oklch(0.96 0.006 265);
    --sf-text-dim: oklch(0.70 0.012 265);
    --sf-accent: oklch(0.88 0.21 128);
    --sf-accent-ink: oklch(0.18 0.04 128);
    --sf-danger: oklch(0.62 0.20 25);
    --sf-ok: oklch(0.80 0.16 150);

    /* Fonts: variables set by next/font in layout.tsx */
    --sf-font-display: var(--font-bricolage), 'Archivo', system-ui, sans-serif;
    --sf-font-body: var(--font-archivo), system-ui, -apple-system, sans-serif;
    --sf-font-mono: var(--font-jetbrains), ui-monospace, 'SFMono-Regular', monospace;

    /* Spacing scale (brutalist jumps) */
    --sf-space-1: 4px;
    --sf-space-2: 8px;
    --sf-space-3: 12px;
    --sf-space-4: 16px;
    --sf-space-5: 24px;
    --sf-space-6: 32px;
    --sf-space-7: 48px;
    --sf-space-8: 64px;
    --sf-space-9: 96px;
    --sf-space-10: 160px;

    /* Motion */
    --sf-ease: cubic-bezier(0.16, 1, 0.3, 1);
    --sf-dur-fast: 180ms;
    --sf-dur: 240ms;

    /* z-index scale */
    --sf-z-header: 10;
    --sf-z-dropdown: 40;
    --sf-z-overlay: 100;
    --sf-z-toast: 1000;
  }

  *, *::before, *::after { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--sf-canvas);
    color: var(--sf-text);
    font-family: var(--sf-font-body);
    -webkit-font-smoothing: antialiased;
  }

  a { color: inherit; }

  ::selection { background: var(--sf-accent); color: var(--sf-accent-ink); }

  :focus-visible { outline: 2px solid var(--sf-accent); outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
