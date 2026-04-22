/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf2f4",
          100: "#fce7eb",
          200: "#f9d0d9",
          300: "#f4a9ba",
          400: "#ec7894",
          500: "#e94560",
          600: "#d62d4a",
          700: "#b41f3a",
          800: "#961c34",
          900: "#801c32",
        },
        dark: {
          50: "#f6f6f9",
          100: "#ececf2",
          200: "#d5d5e3",
          300: "#b0b0c9",
          400: "#8585aa",
          500: "#666690",
          600: "#525279",
          700: "#434363",
          800: "#3a3a54",
          900: "#1a1a2e",
          950: "#0f0f1a",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "spin-slow": "spin 8s linear infinite",
        equalizer: "equalizer 1s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        equalizer: {
          "0%, 100%": { height: "20%" },
          "50%": { height: "100%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
