import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    screens: {
      xs:  "480px",
      sm:  "640px",
      md:  "768px",
      lg:  "1024px",
      xl:  "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        xs:    "480px",
        sm:    "640px",
        md:    "768px",
        lg:    "1024px",
        xl:    "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      /* ── Colors ──────────────────────────────────────────── */
      colors: {
        /* All colors use hsl(var(--token)) — single source of truth */
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50:  "hsl(var(--color-primary-50))",
          100: "hsl(var(--color-primary-100))",
          500: "hsl(var(--color-primary-500))",
          600: "hsl(var(--color-primary-600))",
          700: "hsl(var(--color-primary-700))",
          800: "hsl(var(--color-primary-800))",
          900: "hsl(var(--color-primary-900))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          500: "hsl(var(--color-secondary-500))",
          700: "hsl(var(--color-secondary-700))",
          900: "hsl(var(--color-secondary-900))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          300: "hsl(var(--color-accent-300))",
          400: "hsl(var(--color-accent-400))",
          500: "hsl(var(--color-accent-500))",
          600: "hsl(var(--color-accent-600))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--color-success-500))",
          100:     "hsl(142 76% 93%)",
          700:     "hsl(142 71% 29%)",
        },
        warning: {
          DEFAULT: "hsl(var(--color-warning-500))",
        },
        info: {
          DEFAULT: "hsl(var(--color-info-500))",
        },
        /* Neutral extended */
        neutral: {
          50:  "hsl(var(--color-neutral-50))",
          100: "hsl(var(--color-neutral-100))",
          300: "hsl(var(--color-neutral-300))",
          500: "hsl(var(--color-neutral-500))",
          700: "hsl(var(--color-neutral-700))",
          900: "hsl(var(--color-neutral-900))",
        },
        sidebar: {
          DEFAULT:            "hsl(var(--sidebar-background))",
          foreground:         "hsl(var(--sidebar-foreground))",
          primary:            "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:             "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border:             "hsl(var(--sidebar-border))",
          ring:               "hsl(var(--sidebar-ring))",
        },
      },

      /* ── Border Radius ───────────────────────────────────── */
      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },

      /* ── Box Shadow ──────────────────────────────────────── */
      boxShadow: {
        sm:           "var(--shadow-sm)",
        md:           "var(--shadow-md)",
        lg:           "var(--shadow-lg)",
        xl:           "var(--shadow-xl)",
        "2xl":        "var(--shadow-2xl)",
        "accent-glow":  "var(--shadow-accent-glow)",
        "primary-glow": "var(--shadow-primary-glow)",
        "purple-glow":  "var(--shadow-purple-glow)",
      },

      /* ── Font Families ───────────────────────────────────── */
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body:    ["DM Sans", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
        sans:    ["DM Sans", "sans-serif"],
      },

      /* ── Keyframes ───────────────────────────────────────── */
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to:   { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to:   { height: "0", opacity: "0" },
        },
        slideUpFade: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        levitate: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 hsl(var(--color-accent-400) / 0.4)" },
          "50%":      { boxShadow: "0 0 20px 4px hsl(var(--color-accent-400) / 0.2)" },
        },
      },

      /* ── Animations ──────────────────────────────────────── */
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "slide-up":        "slideUpFade 0.6s cubic-bezier(0,0,0.2,1) forwards",
        "scale-in":        "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "levitate":        "levitate 3s ease-in-out infinite",
        "shimmer":         "shimmer 1.5s infinite",
        "fade-in":         "fadeIn 0.5s cubic-bezier(0,0,0.2,1) forwards",
        "pulse-glow":      "pulseGlow 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
