/**
 * Restaurant OS Design System
 * Typography Tokens - Premium Edition
 *
 * Філософія: "Premium Hierarchy" (Apple/Tesla рівень)
 * - Fluid typography з широкою ієрархією
 * - Чітка візуальна система (Display → Heading → Body → UI)
 * - Преміальні шрифти: Inter, SF Pro Display, Geist Mono
 * - Responsive scale оптимізований для всіх пристроїв
 *
 * Переваги над конкурентами:
 * - Toast/TouchBistro: преміальна типографія, чіткіша ієрархія
 * - Lightspeed: сучасніші шрифти (Inter, Geist)
 * - Square: теплий, елегантний замість холодного
 * - Усі: fluid typography для безшовного responsive
 */

// =============================================================================
// FONT FAMILIES
// =============================================================================

export const fontFamily = {
  // Sans - Primary UI font (Inter - найкращий для інтерфейсів)
  sans: [
    "Inter",
    "SF Pro Text",
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ].join(", "),

  // Display - Для великих заголовків (SF Pro Display)
  display: [
    "SF Pro Display",
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "sans-serif",
  ].join(", "),

  // Mono - Для цифр, кодів, таймерів (Geist Mono - найкращий)
  mono: [
    "Geist Mono",
    "JetBrains Mono",
    "SF Mono",
    "Menlo",
    "Monaco",
    "Consolas",
    "Courier New",
    "monospace",
  ].join(", "),
} as const;

// =============================================================================
// FONT WEIGHTS
// =============================================================================

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

// =============================================================================
// TYPE SCALE (Mobile First - rem based)
// Використовує fluid typography для плавного скейлінгу
// =============================================================================

export const fontSize = {
  // Display - Для hero sections та великих заголовків (premium scale)
  display: {
    xl: "clamp(3rem, 6vw, 5rem)",        // 48-80px - найбільший
    lg: "clamp(2.5rem, 5vw, 4rem)",      // 40-64px
    md: "clamp(2rem, 4vw, 3rem)",        // 32-48px
    sm: "clamp(1.75rem, 3.5vw, 2.5rem)", // 28-40px
  },

  // Heading - Для секцій, cards headers (чітка ієрархія)
  heading: {
    xl: "clamp(1.75rem, 3vw, 2.5rem)",     // 28-40px
    lg: "clamp(1.5rem, 2.5vw, 2rem)",      // 24-32px
    md: "clamp(1.25rem, 2vw, 1.5rem)",     // 20-24px
    sm: "clamp(1.125rem, 1.5vw, 1.25rem)", // 18-20px
  },

  // Body - Для основного тексту (оптимізовано для читабельності)
  body: {
    lg: "1.125rem",   // 18px - важливий текст
    md: "1rem",       // 16px - основний текст (base)
    sm: "0.875rem",   // 14px - secondary текст
    xs: "0.75rem",    // 12px - captions, labels
  },

  // UI - Для інтерфейсних елементів (buttons, inputs)
  ui: {
    lg: "1rem",       // 16px - великі кнопки
    md: "0.875rem",   // 14px - стандартні кнопки
    sm: "0.75rem",    // 12px - малі кнопки
    xs: "0.6875rem",  // 11px - badges, chips
  },
} as const;

// =============================================================================
// LINE HEIGHTS
// =============================================================================

export const lineHeight = {
  none: "1",
  tight: "1.2",       // Заголовки
  snug: "1.35",       // Підзаголовки
  normal: "1.5",      // Основний текст
  relaxed: "1.625",   // Довгі тексти
  loose: "1.75",      // Максимальна читабельність
} as const;

// =============================================================================
// LETTER SPACING
// =============================================================================

export const letterSpacing = {
  tighter: "-0.04em",
  tight: "-0.02em",
  normal: "0",
  wide: "0.02em",
  wider: "0.04em",
  widest: "0.08em",
} as const;

// =============================================================================
// TEXT STYLES (Pre-composed combinations)
// =============================================================================

export const textStyles = {
  // Display styles
  displayLarge: {
    fontSize: fontSize.display.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displayMedium: {
    fontSize: fontSize.display.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontSize: fontSize.display.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Heading styles
  headingXL: {
    fontSize: fontSize.heading.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  headingLG: {
    fontSize: fontSize.heading.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  headingMD: {
    fontSize: fontSize.heading.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  headingSM: {
    fontSize: fontSize.heading.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // Body styles
  bodyLarge: {
    fontSize: fontSize.body.lg,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodyMedium: {
    fontSize: fontSize.body.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSize.body.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Label styles (for UI elements)
  labelLarge: {
    fontSize: fontSize.ui.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },
  labelMedium: {
    fontSize: fontSize.ui.md,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  },
  labelSmall: {
    fontSize: fontSize.ui.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.wider,
  },

  // Special styles
  price: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading.lg,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.tight,
    fontFeatureSettings: "'tnum' on, 'lnum' on", // Tabular numbers
  },
  timer: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading.md,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.normal,
    fontFeatureSettings: "'tnum' on",
  },
  badge: {
    fontSize: fontSize.ui.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.none,
    letterSpacing: letterSpacing.wider,
    textTransform: "uppercase" as const,
  },
  caption: {
    fontSize: fontSize.body.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
} as const;

// =============================================================================
// CSS GENERATOR
// =============================================================================

export function generateTypographyCSSVariables(): string {
  return `
:root {
  /* Font Families */
  --font-sans: ${fontFamily.sans};
  --font-mono: ${fontFamily.mono};

  /* Font Weights */
  --font-weight-regular: ${fontWeight.regular};
  --font-weight-medium: ${fontWeight.medium};
  --font-weight-semibold: ${fontWeight.semibold};
  --font-weight-bold: ${fontWeight.bold};

  /* Line Heights */
  --line-height-none: ${lineHeight.none};
  --line-height-tight: ${lineHeight.tight};
  --line-height-snug: ${lineHeight.snug};
  --line-height-normal: ${lineHeight.normal};
  --line-height-relaxed: ${lineHeight.relaxed};
  --line-height-loose: ${lineHeight.loose};

  /* Letter Spacing */
  --letter-spacing-tight: ${letterSpacing.tight};
  --letter-spacing-normal: ${letterSpacing.normal};
  --letter-spacing-wide: ${letterSpacing.wide};
}
  `.trim();
}

// Type exports
export type TextStyle = keyof typeof textStyles;
export type FontSize = typeof fontSize;
