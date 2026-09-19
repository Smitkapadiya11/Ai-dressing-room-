/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#08090B",
        surface: "#14161A",
        raised: "#1E2127",
        "border-subtle": "#23262C",
        champagne: "#C9A961",
        "champagne-light": "#E8D5A8",
        bone: "#F5F3EF",
        muted: "#8A9099",
        confirm: "#2C6B58",
        "on-surface": "#E2E2E8",
        // light side (shop owner)
        paper: "#FAFAF8",
        ink: "#1A1D22",
        "ink-soft": "#6B7280",
        "line-light": "#E8E4DC",
        "accent-light": "#A8853F",
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["Manrope", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        // clamp(min, preferred, max) — scales from a phone up through a
        // laptop to a lobby display without a breakpoint table to maintain.
        "display-lg": ["clamp(40px, 7vw, 92px)", { lineHeight: "1.14", letterSpacing: "-0.02em", fontWeight: "400" }],
        "display-md": ["clamp(28px, 4.6vw, 54px)", { lineHeight: "1.24", letterSpacing: "-0.01em", fontWeight: "400" }],
        "headline-lg": ["clamp(21px, 3vw, 34px)", { lineHeight: "1.32", letterSpacing: "0em", fontWeight: "500" }],
        "headline-sm": ["clamp(19px, 2.6vw, 28px)", { lineHeight: "1.32", letterSpacing: "0em", fontWeight: "500" }],
        "title-md": ["clamp(16px, 2vw, 23px)", { lineHeight: "1.35", letterSpacing: "0.01em", fontWeight: "500" }],
        "body-lg": ["clamp(14px, 1.5vw, 18px)", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "400" }],
        "body-sm": ["clamp(12px, 1.1vw, 14px)", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "400" }],
        eyebrow: ["clamp(10px, 0.85vw, 12px)", { lineHeight: "1.3", letterSpacing: "0.26em", fontWeight: "600" }],
      },
      borderRadius: { DEFAULT: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.25rem", card: "20px", media: "16px" },
      spacing: {
        "space-xs": "0.375rem",
        "space-sm": "0.75rem",
        "space-md": "1.25rem",
        "space-lg": "2rem",
        "space-xl": "3.5rem",
        gutter: "1.5rem",
        margin: "2.5rem",
      },
      boxShadow: {
        plate: "0 8px 32px rgba(0,0,0,0.45)",
        drawer: "0 16px 48px rgba(0,0,0,0.6)",
        lift: "0 20px 50px rgba(0,0,0,0.7)",
        soft: "0 1px 3px rgba(26,29,34,0.04), 0 8px 24px rgba(26,29,34,0.05)",
      },
    },
  },
  plugins: [],
};
