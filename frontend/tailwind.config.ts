import type { Config } from "tailwindcss";
import { colors } from "./src/styles/tokens/colors";
import { shadows } from "./src/styles/tokens/shadows";
import { radius } from "./src/styles/tokens/radius";
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } from "./src/styles/tokens/typography";

/**
 * Restaurant OS Tailwind Configuration
 * Premium Edition - Glassmorphism Design System
 *
 * Інтегрований з design tokens для єдиного джерела правди
 * Палітра: Navy (#0B1B3B) + White (#FFFFFF) + Electric Blue (#3B82F6)
 */

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // =======================================================================
      // COLORS - Інтегровані з tokens
      // =======================================================================
      colors: {
        // Base colors
        background: colors.background.primary,         // White
        foreground: colors.foreground.primary,         // Navy 950

        // Navy scale (primary brand)
        navy: {
          50: "#F0F4F8",
          100: "#D9E2EC",
          200: "#BCCCDC",
          300: "#9FB3C8",
          400: "#829AB1",
          500: "#627D98",
          600: "#486581",
          700: "#334E68",
          800: "#243B53",
          900: "#102A43",
          950: "#0B1B3B",  // Primary brand
        },

        // Slate scale (secondary)
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },

        // Primary brand colors
        primary: {
          DEFAULT: colors.brand.primary,               // Navy 950
          hover: colors.brand.primaryHover,            // Navy 800
          active: colors.brand.primaryActive,          // Navy 900
          light: colors.brand.primaryLight,            // Navy 100
          foreground: colors.foreground.inverse,       // White
        },

        // Electric Blue (accent/interactive)
        accent: {
          DEFAULT: colors.brand.accent,                // Electric 500
          hover: colors.brand.accentHover,             // Electric 600
          active: colors.brand.accentActive,           // Electric 700
          light: colors.brand.accentLight,             // Electric 100
          foreground: colors.foreground.inverse,       // White
        },

        // Semantic colors
        success: {
          DEFAULT: colors.semantic.success,            // Emerald 500
          hover: colors.semantic.successHover,
          light: colors.semantic.successLight,
          dark: colors.semantic.successDark,
        },
        warning: {
          DEFAULT: colors.semantic.warning,            // Amber 500
          hover: colors.semantic.warningHover,
          light: colors.semantic.warningLight,
          dark: colors.semantic.warningDark,
        },
        error: {
          DEFAULT: colors.semantic.error,              // Red 500
          hover: colors.semantic.errorHover,
          light: colors.semantic.errorLight,
          dark: colors.semantic.errorDark,
        },
        danger: colors.semantic.error,                 // Alias для error
        info: {
          DEFAULT: colors.semantic.info,               // Blue 500
          hover: colors.semantic.infoHover,
          light: colors.semantic.infoLight,
          dark: colors.semantic.infoDark,
        },

        // UI colors
        muted: {
          DEFAULT: colors.background.secondary,        // Slate 50
          foreground: colors.foreground.tertiary,      // Slate 400
        },
        card: {
          DEFAULT: colors.background.primary,          // White
          foreground: colors.foreground.primary,       // Navy 950
        },
        border: colors.border.primary,                 // Slate 200
        input: colors.border.primary,
        ring: colors.border.focus,                     // Electric 500

        // Glassmorphism colors
        glass: {
          DEFAULT: colors.background.glass,            // White 70%
          strong: colors.background.glassStrong,       // White 85%
          subtle: colors.background.glassSubtle,       // White 50%
          dark: colors.background.glassDark,           // Navy 70%
        },
      },

      // =======================================================================
      // TYPOGRAPHY - Інтегрована з tokens
      // =======================================================================
      fontFamily: {
        sans: fontFamily.sans.split(", "),
        display: fontFamily.display.split(", "),
        mono: fontFamily.mono.split(", "),
      },

      fontSize: {
        // Display sizes (fluid typography)
        "display-xl": fontSize.display.xl,
        "display-lg": fontSize.display.lg,
        "display-md": fontSize.display.md,
        "display-sm": fontSize.display.sm,

        // Heading sizes
        "heading-xl": fontSize.heading.xl,
        "heading-lg": fontSize.heading.lg,
        "heading-md": fontSize.heading.md,
        "heading-sm": fontSize.heading.sm,

        // Body sizes
        "body-lg": fontSize.body.lg,
        "body-md": fontSize.body.md,
        "body-sm": fontSize.body.sm,
        "body-xs": fontSize.body.xs,

        // UI sizes
        "ui-lg": fontSize.ui.lg,
        "ui-md": fontSize.ui.md,
        "ui-sm": fontSize.ui.sm,
        "ui-xs": fontSize.ui.xs,
      },

      fontWeight: {
        regular: fontWeight.regular,
        medium: fontWeight.medium,
        semibold: fontWeight.semibold,
        bold: fontWeight.bold,
      },

      lineHeight: {
        none: lineHeight.none,
        tight: lineHeight.tight,
        snug: lineHeight.snug,
        normal: lineHeight.normal,
        relaxed: lineHeight.relaxed,
        loose: lineHeight.loose,
      },

      letterSpacing: {
        tighter: letterSpacing.tighter,
        tight: letterSpacing.tight,
        normal: letterSpacing.normal,
        wide: letterSpacing.wide,
        wider: letterSpacing.wider,
        widest: letterSpacing.widest,
      },

      // =======================================================================
      // SPACING - Mobile First + Safe Areas
      // =======================================================================
      spacing: {
        // Safe area support
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },

      // =======================================================================
      // TOUCH-FRIENDLY SIZES
      // =======================================================================
      minHeight: {
        touch: "44px",      // iOS minimum
        "touch-lg": "48px", // Comfortable
        "touch-xl": "56px", // Large
      },
      minWidth: {
        touch: "44px",
        "touch-lg": "48px",
        "touch-xl": "56px",
      },

      // =======================================================================
      // BORDER RADIUS - Інтегрований з tokens
      // =======================================================================
      borderRadius: {
        xs: radius.xs,
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
        "2xl": radius["2xl"],
        "3xl": radius["3xl"],
        full: radius.full,
      },

      // =======================================================================
      // SHADOWS - Інтегровані з tokens (Glassmorphism shadows)
      // =======================================================================
      boxShadow: {
        xs: shadows.xs,
        sm: shadows.sm,
        md: shadows.md,
        lg: shadows.lg,
        xl: shadows.xl,
        "2xl": shadows["2xl"],
        inner: shadows.inner,

        // Glassmorphism specific
        glass: shadows.glass,
        "glass-hover": shadows.glassHover,
        "glass-strong": shadows.glassStrong,

        // Semantic shadows
        card: shadows.md,
        "card-hover": shadows.lg,
        floating: shadows.xl,

        // Focus rings
        "focus-primary": shadows.focus.primary,
        "focus-error": shadows.focus.error,
        "focus-success": shadows.focus.success,
        "focus-warning": shadows.focus.warning,
      },

      // =======================================================================
      // GLASSMORPHISM UTILITIES
      // =======================================================================
      backdropBlur: {
        glass: "12px",
        "glass-strong": "16px",
        "glass-subtle": "8px",
        none: "0",
      },

      backdropSaturate: {
        glass: "180%",
        "glass-strong": "200%",
        "glass-subtle": "150%",
      },

      // =======================================================================
      // ANIMATIONS - GPU-optimized для glassmorphism
      // =======================================================================
      keyframes: {
        // Existing animations
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },

        // New glassmorphism animations
        "glass-appear": {
          "0%": {
            opacity: "0",
            backdropFilter: "blur(0px)",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            backdropFilter: "blur(12px)",
            transform: "translateY(0)",
          },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },

      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        shake: "shake 0.3s ease-in-out",

        // Glassmorphism animations
        "glass-appear": "glass-appear 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2s infinite",
        "fade-in": "fade-in 200ms ease-out",
        "fade-out": "fade-out 200ms ease-out",
      },

      // =======================================================================
      // TRANSITIONS
      // =======================================================================
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
      },

      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0.0, 0.0, 0.2, 1)",
        "ease-in": "cubic-bezier(0.4, 0.0, 1, 1)",
        "ease-in-out": "cubic-bezier(0.4, 0.0, 0.2, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
  plugins: [],
};

export default config;
