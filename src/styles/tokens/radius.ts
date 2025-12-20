/**
 * Restaurant OS Design System
 * Border Radius Tokens
 *
 * Філософія: "Soft Confidence"
 * - М'які заокруглення для дружнього вигляду
 * - Консистентні значення по всій системі
 * - Більш заокруглений ніж конкуренти (сучасний тренд)
 */

export const radius = {
  // Base scale
  none: "0",
  xs: "0.25rem",    // 4px - subtle rounding
  sm: "0.375rem",   // 6px - small elements
  md: "0.5rem",     // 8px - default
  lg: "0.75rem",    // 12px - cards
  xl: "1rem",       // 16px - larger cards
  "2xl": "1.25rem", // 20px - modals
  "3xl": "1.5rem",  // 24px - large modals
  full: "9999px",   // Pills, circles

  // Semantic
  button: "0.5rem",     // 8px
  input: "0.5rem",      // 8px
  card: "0.75rem",      // 12px
  dialog: "1rem",       // 16px
  badge: "9999px",      // Full pill
  avatar: "9999px",     // Circle
  toast: "0.75rem",     // 12px
} as const;

export function generateRadiusCSSVariables(): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(radius)) {
    lines.push(`  --radius-${key}: ${value};`);
  }
  return `:root {\n${lines.join("\n")}\n}`;
}

export type Radius = keyof typeof radius;
