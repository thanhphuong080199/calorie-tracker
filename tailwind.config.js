/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Dark theme palette (see src/theme/colors.ts for the JS mirror)
        bg: "#0F0F0F", // app background
        surface: "#1A1A1A", // cards
        surface2: "#242424", // elevated / inputs
        border: "#2E2E2E",
        accent: "#4CAF50", // green — progress / positive
        warn: "#FF6B35", // orange — near limit
        danger: "#EF4444", // red — over limit
        textPrimary: "#F5F5F5",
        textSecondary: "#A3A3A3",
        textMuted: "#6B6B6B",
      },
    },
  },
  plugins: [],
};
