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
        background: {
          primary: "#0F172A",
          secondary: "#1E293B",
          tertiary: "#334155",
          elevated: "#1E293B",
        },
        neon: {
          blue: "#3B82F6",
          green: "#10B981",
          orange: "#F59E0B",
          red: "#EF4444",
          purple: "#8B5CF6",
          cyan: "#06B6D4",
        },
        rarity: {
          common: "#6B7280",
          uncommon: "#10B981",
          rare: "#3B82F6",
          epic: "#8B5CF6",
          legendary: "#F59E0B",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.1)",
          moderate: "rgba(255, 255, 255, 0.2)",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "neon-blue": "0 0 20px rgba(59, 130, 246, 0.5)",
        "neon-green": "0 0 20px rgba(16, 185, 129, 0.5)",
        "neon-orange": "0 0 20px rgba(245, 158, 11, 0.5)",
        "neon-red": "0 0 20px rgba(239, 68, 68, 0.5)",
        "neon-purple": "0 0 20px rgba(139, 92, 246, 0.5)",
        "neon-cyan": "0 0 20px rgba(6, 182, 212, 0.5)",
        glow: "0 0 40px rgba(59, 130, 246, 0.3)",
        card: "0 4px 20px rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-legendary": "glow-legendary 2s ease-in-out infinite",
        "glow-epic": "glow-epic 2.5s ease-in-out infinite",
        "spin-3d": "spin-3d 1s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "scan-line": "scanLine 2s linear infinite",
      },
      keyframes: {
        "glow-legendary": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(245, 158, 11, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(245, 158, 11, 0.8)" },
        },
        "glow-epic": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)" },
          "50%": { boxShadow: "0 0 30px rgba(139, 92, 246, 0.7)" },
        },
        "spin-3d": {
          "0%": { transform: "rotateY(0deg) scale(1)" },
          "50%": { transform: "rotateY(180deg) scale(1.2)" },
          "100%": { transform: "rotateY(360deg) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)",
        "noise-overlay":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
