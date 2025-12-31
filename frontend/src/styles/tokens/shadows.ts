/**
 * Restaurant OS Design System
 * Shadow Tokens - Premium Edition
 *
 * Філософія: "Delicate Depth" для glassmorphism
 * - Делікатні тіні для glass elements
 * - Navy-toned shadows замість warm brown
 * - Оптимізовано для білого background
 * - Чітка ієрархія elevation
 *
 * Переваги над конкурентами:
 * - Софістиковані glass shadows (унікальні)
 * - Делікатніші та преміальніші ніж у Square
 * - Сучасніша палітра ніж у Toast/Lightspeed
 */

// Navy-toned shadow color (для glassmorphism aesthetic)
const shadowColor = "11 27 59"; // Navy RGB (11, 27, 59)

export const shadows = {
  // No shadow
  none: "none",

  // Delicate shadows для glassmorphism
  xs: `0 1px 2px rgba(${shadowColor}, 0.04)`,
  sm: `0 2px 4px rgba(${shadowColor}, 0.06)`,
  md: `0 4px 8px rgba(${shadowColor}, 0.08)`,
  lg: `0 8px 16px rgba(${shadowColor}, 0.1)`,
  xl: `0 12px 24px rgba(${shadowColor}, 0.12)`,
  "2xl": `0 24px 48px rgba(${shadowColor}, 0.15)`,

  // Glassmorphism specific shadows 🆕
  glass: `0 8px 32px rgba(${shadowColor}, 0.08), 0 1px 2px rgba(${shadowColor}, 0.04)`,
  glassHover: `0 12px 40px rgba(${shadowColor}, 0.12), 0 2px 4px rgba(${shadowColor}, 0.06)`,
  glassStrong: `0 12px 48px rgba(${shadowColor}, 0.15), 0 4px 8px rgba(${shadowColor}, 0.08)`,

  // Inner shadow
  inner: `inset 0 2px 4px rgba(${shadowColor}, 0.06)`,

  // Focus rings - Electric blue для premium look
  focus: {
    primary: `0 0 0 3px rgba(59, 130, 246, 0.3)`,   // Electric blue
    error: `0 0 0 3px rgba(239, 68, 68, 0.3)`,      // Red
    success: `0 0 0 3px rgba(16, 185, 129, 0.3)`,   // Emerald
    warning: `0 0 0 3px rgba(245, 158, 11, 0.3)`,   // Amber
  },
} as const;

// =============================================================================
// SEMANTIC SHADOWS
// =============================================================================

export const semanticShadows = {
  // Card elevation levels
  card: {
    flat: shadows.none,
    raised: shadows.sm,
    floating: shadows.md,
  },

  // Interactive states
  interactive: {
    default: shadows.sm,
    hover: shadows.md,
    active: shadows.xs,
  },

  // Modal/dialog
  overlay: {
    dropdown: shadows.lg,
    modal: shadows["2xl"],
    tooltip: shadows.md,
  },

  // Input states
  input: {
    default: shadows.inner,
    focus: shadows.focus.primary,
    error: shadows.focus.error,
  },
} as const;

// =============================================================================
// CSS GENERATOR
// =============================================================================

export function generateShadowCSSVariables(): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(shadows)) {
    if (typeof value === "string") {
      lines.push(`  --shadow-${key}: ${value};`);
    } else if (typeof value === "object") {
      for (const [subKey, subValue] of Object.entries(value)) {
        lines.push(`  --shadow-${key}-${subKey}: ${subValue};`);
      }
    }
  }

  return `:root {\n${lines.join("\n")}\n}`;
}

export type Shadow = keyof typeof shadows;
export type SemanticShadow = typeof semanticShadows;
