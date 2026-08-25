import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        card: "var(--card)",
        "card-hover": "var(--card-hover)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        "border-glow": "var(--border-glow)",
        accent: "var(--accent)",
        "accent-glow": "var(--accent-glow)",
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
        purple: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        bento: "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border)",
        "bento-hover": "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--border-glow), 0 0 25px -5px rgba(168, 85, 247, 0.15)",
        "bento-glow-purple": "0 0 30px -5px rgba(168, 85, 247, 0.25)",
        "bento-glow-cyan": "0 0 30px -5px rgba(6, 182, 212, 0.25)",
        "bento-glow-emerald": "0 0 30px -5px rgba(34, 197, 94, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radarSweep 4s linear infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        radarSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
