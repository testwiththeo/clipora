import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#09090b",
          surface: "#111113",
          elevated: "#18181b",
          hover: "#1f1f23",
        },
        line: {
          DEFAULT: "#27272a",
          subtle: "#1e1e22",
        },
        content: {
          primary: "#fafafa",
          secondary: "#a1a1aa",
          muted: "#52525b",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
          fg: "#ffffff",
          muted: "#312e81",
        },
        status: {
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
        },
      },
      borderRadius: {
        control: "8px",
        panel: "12px",
        overlay: "16px",
      },
      fontSize: {
        "page-title": ["28px", { lineHeight: "34px", fontWeight: "600" }],
        "section-title": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        label: ["13px", { lineHeight: "18px", fontWeight: "500" }],
        meta: ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
      spacing: {
        "0.5": "2px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
