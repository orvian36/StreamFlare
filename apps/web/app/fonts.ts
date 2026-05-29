import { Sora, Inter, JetBrains_Mono } from "next/font/google";

// Geometric display face (Aurora Noir). To self-host Clash Display later,
// replace this with next/font/local pointing at the woff2 and keep the same
// `--font-display` variable name.
export const fontDisplay = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = `${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`;
