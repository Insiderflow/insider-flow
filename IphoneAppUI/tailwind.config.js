/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#04060A",
        surface: {
          DEFAULT: "#0C1018",
          elevated: "#121820",
          glass: "rgba(14, 20, 28, 0.82)",
        },
        buy: {
          DEFAULT: "#34D399",
          muted: "rgba(52, 211, 153, 0.12)",
          glow: "rgba(52, 211, 153, 0.35)",
        },
        sell: {
          DEFAULT: "#FB7185",
          muted: "rgba(251, 113, 133, 0.12)",
          glow: "rgba(251, 113, 133, 0.35)",
        },
        proposed: {
          DEFAULT: "#FBBF24",
          muted: "rgba(251, 191, 36, 0.12)",
        },
        flow: {
          DEFAULT: "#22D3EE",
          muted: "rgba(34, 211, 238, 0.12)",
          dim: "rgba(34, 211, 238, 0.06)",
        },
        plan: {
          DEFAULT: "#22D3EE",
          muted: "rgba(34, 211, 238, 0.12)",
        },
        accent: {
          blue: "#38BDF8",
          purple: "#A78BFA",
          amber: "#FBBF24",
        },
        muted: {
          DEFAULT: "#64748B",
          foreground: "#94A3B8",
        },
        border: {
          DEFAULT: "rgba(148, 163, 184, 0.1)",
          strong: "rgba(148, 163, 184, 0.16)",
        },
      },
      fontFamily: {
        sans: ["Instrument Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "18px",
        panel: "14px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
        dock: "0 12px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(148,163,184,0.08)",
        glowBuy: "0 0 24px rgba(52, 211, 153, 0.15)",
        glowSell: "0 0 24px rgba(251, 113, 133, 0.15)",
        glowFlow: "0 0 28px rgba(34, 211, 238, 0.12)",
      },
      animation: {
        "fade-up": "fadeUp 0.45s ease-out forwards",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
