import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mirrors theme.ts — use these in className if preferred over inline
        bg: "#06060f",
        sidebar: "#04040c",
        card: "#0d0d20",
        hover: "#12122a",
        border: "#1c1c3a",
        accent: {
          java:   "#f59e0b",
          oop:    "#fb923c",
          adv:    "#e879f9",
          dsa:    "#a78bfa",
          spring: "#4ade80",
          devops: "#22d3ee",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["Fira Code", "JetBrains Mono", "monospace"],
      },
      maxWidth: {
        layout: "1400px",
      },
    },
  },
  plugins: [],
} satisfies Config;
