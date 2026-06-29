/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          muted: "var(--accent-muted)",
        },
        border: "var(--border)",
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
        "fade-in": "fadeIn 0.15s ease-out",
      },
      keyframes: {
        slideIn: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
