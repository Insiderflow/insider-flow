/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0A0A0A",
        surface: {
          DEFAULT: "#141414",
          elevated: "#1C1C1E",
          glass: "rgba(28, 28, 30, 0.72)",
        },
        buy: {
          DEFAULT: "#22C55E",
          muted: "rgba(34, 197, 94, 0.15)",
          glow: "rgba(34, 197, 94, 0.35)",
        },
        sell: {
          DEFAULT: "#EF4444",
          muted: "rgba(239, 68, 68, 0.15)",
          glow: "rgba(239, 68, 68, 0.35)",
        },
        proposed: {
          DEFAULT: "#F97316",
          muted: "rgba(249, 115, 22, 0.15)",
        },
        accent: {
          blue: "#3B82F6",
          purple: "#A855F7",
        },
        muted: {
          DEFAULT: "#71717A",
          foreground: "#A1A1AA",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          strong: "rgba(255, 255, 255, 0.12)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        glowBuy: "0 0 20px rgba(34, 197, 94, 0.2)",
        glowSell: "0 0 20px rgba(239, 68, 68, 0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.45s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
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
