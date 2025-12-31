/**
 * Restaurant OS Design System
 * Spacing Tokens
 *
 * Філософія: "Breathing Room"
 * - Консистентна 4px base grid
 * - Достатньо простору для touch targets
 * - Візуальне дихання між елементами
 *
 * Переваги над конкурентами:
 * - Чітка система замість хаотичних значень
 * - Оптимізовано для touch (мін. 44px interactive areas)
 */

// =============================================================================
// BASE SPACING SCALE (4px base)
// =============================================================================

export const spacing = {
  // Micro spacing (for fine-tuning)
  px: "1px",
  0.5: "0.125rem",  // 2px
  1: "0.25rem",     // 4px
  1.5: "0.375rem",  // 6px
  2: "0.5rem",      // 8px
  2.5: "0.625rem",  // 10px
  3: "0.75rem",     // 12px
  3.5: "0.875rem",  // 14px

  // Standard spacing
  4: "1rem",        // 16px - base unit
  5: "1.25rem",     // 20px
  6: "1.5rem",      // 24px
  7: "1.75rem",     // 28px
  8: "2rem",        // 32px

  // Large spacing
  9: "2.25rem",     // 36px
  10: "2.5rem",     // 40px
  11: "2.75rem",    // 44px - minimum touch target
  12: "3rem",       // 48px
  14: "3.5rem",     // 56px
  16: "4rem",       // 64px

  // Extra large spacing
  20: "5rem",       // 80px
  24: "6rem",       // 96px
  28: "7rem",       // 112px
  32: "8rem",       // 128px
  36: "9rem",       // 144px
  40: "10rem",      // 160px
} as const;

// =============================================================================
// SEMANTIC SPACING
// =============================================================================

export const semanticSpacing = {
  // Component internal spacing
  component: {
    xs: spacing[1],     // 4px - tight internal spacing
    sm: spacing[2],     // 8px - small padding
    md: spacing[3],     // 12px - default padding
    lg: spacing[4],     // 16px - comfortable padding
    xl: spacing[6],     // 24px - generous padding
  },

  // Gaps between elements
  gap: {
    xs: spacing[1],     // 4px - very tight
    sm: spacing[2],     // 8px - tight
    md: spacing[3],     // 12px - default
    lg: spacing[4],     // 16px - comfortable
    xl: spacing[6],     // 24px - generous
    "2xl": spacing[8],  // 32px - very generous
  },

  // Page/section margins
  section: {
    xs: spacing[4],     // 16px
    sm: spacing[6],     // 24px
    md: spacing[8],     // 32px
    lg: spacing[12],    // 48px
    xl: spacing[16],    // 64px
  },

  // Touch-specific
  touch: {
    minTarget: spacing[11],  // 44px - iOS/Android minimum
    comfortable: spacing[12], // 48px - Google recommended
    large: spacing[14],       // 56px - extra large buttons
  },

  // Safe areas (for notched devices)
  safe: {
    top: "env(safe-area-inset-top)",
    bottom: "env(safe-area-inset-bottom)",
    left: "env(safe-area-inset-left)",
    right: "env(safe-area-inset-right)",
  },
} as const;

// =============================================================================
// LAYOUT SPACING
// =============================================================================

export const layoutSpacing = {
  // Page padding
  pagePadding: {
    mobile: spacing[4],   // 16px
    tablet: spacing[6],   // 24px
    desktop: spacing[8],  // 32px
  },

  // Card padding
  cardPadding: {
    mobile: spacing[4],   // 16px
    tablet: spacing[5],   // 20px
    desktop: spacing[6],  // 24px
  },

  // Header heights
  header: {
    mobile: spacing[14],  // 56px
    desktop: spacing[16], // 64px
  },

  // Bottom navigation height
  bottomNav: {
    default: spacing[16],  // 64px
    withSafe: `calc(${spacing[16]} + env(safe-area-inset-bottom))`,
  },

  // Sidebar widths
  sidebar: {
    collapsed: spacing[16], // 64px
    expanded: "280px",
  },
} as const;

// =============================================================================
// CSS GENERATOR
// =============================================================================

export function generateSpacingCSSVariables(): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(spacing)) {
    lines.push(`  --spacing-${key}: ${value};`);
  }

  return `:root {\n${lines.join("\n")}\n}`;
}

// Type exports
export type Spacing = keyof typeof spacing;
export type SemanticSpacing = typeof semanticSpacing;
