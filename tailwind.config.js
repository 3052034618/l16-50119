/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#4CAF50",
          600: "#2E7D32",
          700: "#1B5E20",
          800: "#155724",
          900: "#0D3D14",
        },
        alert: {
          warn: "#E65100",
          danger: "#C62828",
          info: "#1565C0",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(27, 94, 32, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        hover: "0 8px 24px rgba(27, 94, 32, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)",
        inner: "inset 0 1px 3px rgba(27, 94, 32, 0.06)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "stagger-in": "staggerIn 0.4s ease-out forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "scale-in": "scaleIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        staggerIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
