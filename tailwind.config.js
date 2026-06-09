/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand — warm, trustworthy, family-friendly
        brand: {
          50: "#FFF8F0",
          100: "#FFEFD6",
          200: "#FFDBA8",
          300: "#FFC170",
          400: "#FFA033",
          500: "#F08C00", // Primary orange
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        // Secondary — calm, reliable
        ocean: {
          50: "#F0F7FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A5F",
        },
        // Neutrals — warm grays
        warm: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        // Accent for verified badges, success states
        verified: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        // Featured listing highlight
        featured: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
        },
        // Copper accent — premium, warm
        copper: {
          50: "#FDF5F0",
          100: "#F9E6D8",
          200: "#F0C9AE",
          300: "#E4A87A",
          400: "#D4885A",
          500: "#C07040",
          600: "#A85D35",
          700: "#8C4C2C",
        },
        // Cream background
        cream: "#FAFAF8",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-sm": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.12), 0 8px 30px rgba(0,0,0,0.06)",
        featured: "0 0 0 2px #F59E0B, 0 4px 20px rgba(245, 158, 11, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "slide-in-right": "slideInRight 0.3s ease-out forwards",
        shimmer: "shimmer 2.4s linear infinite",
        pop: "pop 0.45s cubic-bezier(0.22, 1.4, 0.36, 1)",
        "badge-pulse": "badgePulse 2s ease-in-out infinite",
        "placeholder-rotate":
          "placeholderRotate 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.6) translateY(8px)" },
          "60%": { opacity: "1", transform: "scale(1.12) translateY(0)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        badgePulse: {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.45)",
          },
          "50%": {
            transform: "scale(1.05)",
            boxShadow: "0 0 0 8px rgba(220, 38, 38, 0)",
          },
        },
        placeholderRotate: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
