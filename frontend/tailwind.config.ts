import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand gold — drawn from the LSJ emblem (antique gold)
        gold: {
          DEFAULT: "#c49a5c",
          dark: "#a87c45",
          light: "#e4c58e",
          bg: "#fbf6ee",
        },
        // Peacock teal — the gem accent in the logo's flame
        teal: {
          DEFAULT: "#1b8a94",
          dark: "#136b73",
          light: "#5fb8c0",
          bg: "#ebf6f7",
        },
        cream: "#faf7f2",
        dark: "#221f1d",
        gray: {
          DEFAULT: "#666666",
          mid: "#999999",
          light: "#f4f4f4",
        },
        border: "#eadfcf",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "12px",
        lg: "20px",
        pill: "50px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,0.06)",
        md: "0 6px 20px rgba(0,0,0,0.10)",
        lg: "0 12px 32px rgba(0,0,0,0.14)",
      },
      animation: {
        "marquee": "marquee 30s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "bounce-soft": "bounceSoft 0.6s ease-out",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
