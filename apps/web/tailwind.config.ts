import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fresco: {
          paper: "#E4E2D8",
          sheet: "#F3F1E9",
          ink: "#11221A",
          inkSoft: "#26352C",
          muted: "#6B7B71",
          faint: "#8A988E",
          green: "#0F8A4F",
          fresh: "#15B86E",
          freshMint: "#7FE3AB",
          soon: "#F6A723",
          soonDeep: "#C8851A",
          now: "#FB4E3D",
          card: "#1C3328",
        },
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "sans-serif"],
        body: ["var(--font-hanken)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      borderRadius: {
        card: "18px",
        sheet: "26px",
      },
      keyframes: {
        "fresco-scan": {
          "0%": { top: "8%", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { top: "90%", opacity: "0" },
        },
        "fresco-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        "fresco-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
      },
      animation: {
        "fresco-scan": "fresco-scan 1.8s ease-in-out infinite",
        "fresco-pulse": "fresco-pulse 2.4s ease-in-out infinite",
        "fresco-blink": "fresco-blink 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
