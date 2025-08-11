
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssContainerQueries from "@tailwindcss/container-queries";

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
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'rawline': ['Rawline', 'Raleway', 'sans-serif'],
        'base': ['var(--font-family-base)'],
      },
      fontSize: {
        'scale-up-07': ['var(--font-size-scale-up-07)', { lineHeight: 'var(--font-lineheight-low)' }],
        'scale-up-06': ['var(--font-size-scale-up-06)', { lineHeight: 'var(--font-lineheight-low)' }],
        'scale-up-05': ['var(--font-size-scale-up-05)', { lineHeight: 'var(--font-lineheight-low)' }],
        'scale-up-04': ['var(--font-size-scale-up-04)', { lineHeight: 'var(--font-lineheight-low)' }],
        'scale-up-03': ['var(--font-size-scale-up-03)', { lineHeight: 'var(--font-lineheight-low)' }],
        'scale-up-02': ['var(--font-size-scale-up-02)', { lineHeight: 'var(--font-lineheight-medium)' }],
        'scale-up-01': ['var(--font-size-scale-up-01)', { lineHeight: 'var(--font-lineheight-medium)' }],
        'scale-base': ['var(--font-size-scale-base)', { lineHeight: 'var(--font-lineheight-medium)' }],
        'scale-down-01': ['var(--font-size-scale-down-01)', { lineHeight: 'var(--font-lineheight-medium)' }],
        'scale-down-02': ['var(--font-size-scale-down-02)', { lineHeight: 'var(--font-lineheight-medium)' }],
        'scale-down-03': ['var(--font-size-scale-down-03)', { lineHeight: 'var(--font-lineheight-medium)' }],
      },
      fontWeight: {
        'thin': 'var(--font-weight-thin)',
        'extra-light': 'var(--font-weight-extra-light)',
        'light': 'var(--font-weight-light)',
        'regular': 'var(--font-weight-regular)',
        'medium': 'var(--font-weight-medium)',
        'semi-bold': 'var(--font-weight-semi-bold)',
        'bold': 'var(--font-weight-bold)',
        'extra-bold': 'var(--font-weight-extra-bold)',
        'black': 'var(--font-weight-black)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        government: {
          "50": "hsl(var(--government-50))",
          "100": "hsl(var(--government-100))",
          "200": "hsl(var(--government-200))",
          "500": "hsl(var(--government-500))",
          "600": "hsl(var(--government-600))",
          "700": "hsl(var(--government-700))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: "hsl(var(--surface))",
        mutedSurface: "hsl(var(--muted-surface))",
        ink: "hsl(var(--ink))",
        mutedInk: "hsl(var(--muted-ink))",
        borderSubtle: "hsl(var(--border-subtle))",
        cta: {
          DEFAULT: "hsl(var(--cta))",
          foreground: "hsl(var(--cta-foreground))",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        slideUp: "slideUp 0.5s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindcssContainerQueries],
} satisfies Config;
