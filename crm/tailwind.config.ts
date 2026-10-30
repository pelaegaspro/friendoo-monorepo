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
        accent: {
          DEFAULT: "#1F5C4E",
          hover: "#17463B",
          light: "#EBF3F0",
        },
      },
      borderRadius: {
        DEFAULT: "12px",
        card: "12px",
      },
      fontSize: {
        // Strict 4-size typography hierarchy: 12px, 14px, 20px, 32px
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "20px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "3xl": ["32px", { lineHeight: "40px" }],
      },
      spacing: {
        // 8px spacing grid: 4, 8, 16, 24, 32
        1: "4px",
        2: "8px",
        4: "16px",
        6: "24px",
        8: "32px",
      },
    },
  },
  plugins: [],
};

export default config;
