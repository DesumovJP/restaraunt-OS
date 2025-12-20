/**
 * Restaurant OS Design System
 * Color Tokens - Premium Edition
 *
 * Філософія: "Premium Simplicity"
 * - Глибокий navy blue + чистий white для максимальної читабельності
 * - Glassmorphism для сучасного, преміального вигляду
 * - Electric blue акценти для інтерактивності
 * - Мінімалізм рівня Apple/Tesla
 *
 * Переваги над конкурентами:
 * - Toast: професійніший, менш агресивний ніж оранжевий + glassmorphism
 * - Square: теплий та глибокий замість холодного чорно-білого
 * - Lightspeed: елегантний premium navy замість корпоративного синього
 * - TouchBistro: сучасна палітра + glassmorphism замість застарілого flat
 */

// =============================================================================
// PRIMITIVE COLORS (Raw values - not for direct use)
// =============================================================================

const primitives = {
  // Pure neutrals - Максимальна чистота та контраст
  white: "#FFFFFF",
  black: "#000000",

  // Navy scale - Головний brand колір (замість Sage green)
  navy: {
    50: "#F0F4F8",   // Lightest - для subtle backgrounds
    100: "#D9E2EC",  // Дуже світлий - для hover states
    200: "#BCCCDC",  // Світлий - для borders
    300: "#9FB3C8",  // М'який - для disabled states
    400: "#829AB1",  // Середній світлий
    500: "#627D98",  // Середній
    600: "#486581",  // Середній темний
    700: "#334E68",  // Темний - для text
    800: "#243B53",  // Дуже темний
    900: "#102A43",  // Майже чорний
    950: "#0B1B3B",  // Primary brand - найглибший navy
  },

  // Slate scale - Для вторинних елементів та тексту (замість Ink)
  slate: {
    50: "#F8FAFC",   // Lightest background
    100: "#F1F5F9",  // Subtle background
    200: "#E2E8F0",  // Light borders
    300: "#CBD5E1",  // Borders
    400: "#94A3B8",  // Muted text
    500: "#64748B",  // Secondary text
    600: "#475569",  // Text
    700: "#334155",  // Dark text
    800: "#1E293B",  // Darker text
    900: "#0F172A",  // Almost black
  },

  // Electric Blue - Акценти та інтерактивні елементи (замість Blush)
  electric: {
    50: "#EFF6FF",   // Lightest - для backgrounds
    100: "#DBEAFE",  // Дуже світлий - для light variants
    200: "#BFDBFE",  // Світлий
    300: "#93C5FD",  // М'який
    400: "#60A5FA",  // Середній
    500: "#3B82F6",  // Primary interactive - головний акцент
    600: "#2563EB",  // Hover state
    700: "#1D4ED8",  // Active state
    800: "#1E40AF",  // Darker
    900: "#1E3A8A",  // Darkest
  },

  // Semantic colors - Modern tech-oriented palette
  emerald: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",  // Success
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
  },

  amber: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",  // Warning
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },

  red: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",  // Error
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },

  blue: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",  // Info
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },
} as const;

// =============================================================================
// SEMANTIC TOKENS (For use in components)
// =============================================================================

export const colors = {
  // Background
  background: {
    primary: primitives.white,              // Main app background - чистий білий
    secondary: primitives.slate[50],        // Elevated surfaces - дуже світлий сірий
    tertiary: primitives.slate[100],        // Cards, panels
    inverse: primitives.navy[950],          // Dark surfaces - глибокий navy
    disabled: primitives.slate[100],        // Disabled state
    // Glassmorphism backgrounds 🆕
    glass: "rgba(255, 255, 255, 0.7)",      // Основний glass ефект
    glassStrong: "rgba(255, 255, 255, 0.85)", // Сильніший glass
    glassSubtle: "rgba(255, 255, 255, 0.5)", // М'який glass
    glassDark: "rgba(11, 27, 59, 0.7)",     // Темний glass (navy з прозорістю)
  },

  // Foreground (Text)
  foreground: {
    primary: primitives.navy[950],          // Main text - глибокий navy
    secondary: primitives.slate[600],       // Secondary text - середній slate
    tertiary: primitives.slate[400],        // Placeholder, muted
    inverse: primitives.white,              // Text on dark surfaces - білий
    disabled: primitives.slate[300],        // Disabled text
  },

  // Brand
  brand: {
    primary: primitives.navy[950],          // Primary brand - глибокий navy
    primaryHover: primitives.navy[800],     // Hover state
    primaryActive: primitives.navy[900],    // Active/pressed state
    primaryLight: primitives.navy[100],     // Light backgrounds
    primaryLighter: primitives.navy[50],    // Lightest backgrounds

    // Electric blue - для акцентів та інтерактивності
    accent: primitives.electric[500],       // Primary interactive - electric blue
    accentHover: primitives.electric[600],  // Hover
    accentActive: primitives.electric[700], // Active
    accentLight: primitives.electric[100],  // Light background
    accentLighter: primitives.electric[50], // Lightest background
  },

  // Semantic - Modern tech colors
  semantic: {
    success: primitives.emerald[500],       // Success - emerald green
    successHover: primitives.emerald[600],
    successLight: primitives.emerald[100],
    successBorder: primitives.emerald[300],
    successDark: primitives.emerald[700],

    warning: primitives.amber[500],         // Warning - amber
    warningHover: primitives.amber[600],
    warningLight: primitives.amber[100],
    warningBorder: primitives.amber[300],
    warningDark: primitives.amber[700],

    error: primitives.red[500],             // Error - red
    errorHover: primitives.red[600],
    errorLight: primitives.red[100],
    errorBorder: primitives.red[300],
    errorDark: primitives.red[700],

    info: primitives.blue[500],             // Info - blue
    infoHover: primitives.blue[600],
    infoLight: primitives.blue[100],
    infoBorder: primitives.blue[300],
    infoDark: primitives.blue[700],
  },

  // Border
  border: {
    primary: primitives.slate[200],         // Default borders - світлий slate
    secondary: primitives.slate[100],       // Subtle borders
    tertiary: primitives.slate[50],         // Найтонший border
    focus: primitives.electric[500],        // Focus rings - electric blue
    error: primitives.red[400],             // Error border
    success: primitives.emerald[400],       // Success border
    // Glassmorphism borders 🆕
    glass: "rgba(255, 255, 255, 0.2)",      // Glass border - делікатний
    glassDark: "rgba(11, 27, 59, 0.1)",     // Dark glass border
  },

  // Interactive
  interactive: {
    hover: primitives.slate[100],           // Hover background
    active: primitives.slate[200],          // Active background
    selected: primitives.electric[50],      // Selected state - electric blue light
    selectedBorder: primitives.electric[500], // Selected border
    disabled: primitives.slate[50],         // Disabled background
  },

  // Overlay
  overlay: {
    light: "rgba(255, 255, 255, 0.8)",      // Light overlay
    dark: "rgba(11, 27, 59, 0.5)",          // Dark overlay - navy з 50% прозорості
    heavy: "rgba(11, 27, 59, 0.8)",         // Heavy overlay - navy з 80%
    backdrop: "rgba(0, 0, 0, 0.5)",         // Modal backdrop
  },
} as const;

// =============================================================================
// CSS CUSTOM PROPERTIES GENERATOR
// =============================================================================

export function generateColorCSSVariables(): string {
  const lines: string[] = [];

  const flatten = (obj: Record<string, unknown>, prefix = ""): void => {
    for (const [key, value] of Object.entries(obj)) {
      const varName = prefix ? `${prefix}-${key}` : key;
      if (typeof value === "string") {
        lines.push(`  --color-${varName}: ${value};`);
      } else if (typeof value === "object" && value !== null) {
        flatten(value as Record<string, unknown>, varName);
      }
    }
  };

  flatten(colors);
  return `:root {\n${lines.join("\n")}\n}`;
}

// Type exports
export type ColorToken = typeof colors;
export type SemanticColor = keyof typeof colors.semantic;
export type BrandColor = keyof typeof colors.brand;
