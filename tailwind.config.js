/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light theme (see src/theme/colors.ts for the JS mirror)
        bg: "#F5F7F1", // app background — soft warm off-white
        surface: "#FFFFFF", // cards
        surface2: "#EEF1E8", // elevated / inputs / progress tracks
        border: "#E3E7DC",
        accent: "#7CC242", // fresh lime green — progress / positive
        onAccent: "#16210B", // text/icons on an accent fill
        warn: "#F5A623", // amber — near limit
        danger: "#E5484D", // red — over limit
        textPrimary: "#1E241A",
        textSecondary: "#667063",
        textMuted: "#98A08F",
      },
      fontFamily: {
        // Space Grotesk — a characterful grotesk with strong figures, used for
        // numbers and titles. Body copy stays on the system font.
        display: ["SpaceGrotesk_700Bold"],
      },
    },
  },
  plugins: [],
};
