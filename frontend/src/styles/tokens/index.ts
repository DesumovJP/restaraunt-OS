/**
 * Restaurant OS Design System
 * Design Tokens - Unified Export
 *
 * Цей файл експортує всі design tokens з єдиної точки входу.
 * Використовуйте цей файл для імпорту токенів у компонентах.
 *
 * @example
 * import { colors, spacing, typography } from '@/styles/tokens';
 */

// Core token modules
export * from "./colors";
export * from "./typography";
export * from "./spacing";
export * from "./radius";
export * from "./shadows";
export * from "./motion";
export * from "./effects"; // 🆕 Glassmorphism effects

// Re-export for convenience
import { colors, generateColorCSSVariables } from "./colors";
import {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textStyles,
  generateTypographyCSSVariables,
} from "./typography";
import {
  spacing,
  semanticSpacing,
  layoutSpacing,
  generateSpacingCSSVariables,
} from "./spacing";
import { radius, generateRadiusCSSVariables } from "./radius";
import {
  shadows,
  semanticShadows,
  generateShadowCSSVariables,
} from "./shadows";
import {
  duration,
  easing,
  transitions,
  keyframes,
  animations,
  generateMotionCSSVariables,
} from "./motion";
import {
  glass,
  gradients,
  gpuOptimized,
  browserSupport,
  adaptiveEffects,
  generateGlassCSSVariables,
  generateGlassUtilityClasses,
} from "./effects";

// =============================================================================
// UNIFIED TOKENS OBJECT
// =============================================================================

export const tokens = {
  colors,
  typography: {
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight,
    letterSpacing,
    textStyles,
  },
  spacing: {
    scale: spacing,
    semantic: semanticSpacing,
    layout: layoutSpacing,
  },
  radius,
  shadows: {
    scale: shadows,
    semantic: semanticShadows,
  },
  motion: {
    duration,
    easing,
    transitions,
    keyframes,
    animations,
  },
  effects: { // 🆕 Glassmorphism effects
    glass,
    gradients,
    gpuOptimized,
    browserSupport,
    adaptiveEffects,
  },
} as const;

// =============================================================================
// CSS VARIABLES GENERATOR
// =============================================================================

export function generateAllCSSVariables(): string {
  return [
    "/* ============================================ */",
    "/* Restaurant OS Design System CSS Variables   */",
    "/* Premium Edition - Glassmorphism             */",
    "/* Generated - Do not edit manually            */",
    "/* ============================================ */",
    "",
    "/* Colors */",
    generateColorCSSVariables(),
    "",
    "/* Typography */",
    generateTypographyCSSVariables(),
    "",
    "/* Spacing */",
    generateSpacingCSSVariables(),
    "",
    "/* Border Radius */",
    generateRadiusCSSVariables(),
    "",
    "/* Shadows */",
    generateShadowCSSVariables(),
    "",
    "/* Motion */",
    generateMotionCSSVariables(),
    "",
    "/* Glassmorphism Effects */",
    generateGlassCSSVariables(),
  ].join("\n");
}

/**
 * Генерує glassmorphism utility classes
 * Використовується в globals.css
 */
export function generateAllGlassUtilities(): string {
  return generateGlassUtilityClasses();
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Tokens = typeof tokens;
export type ColorTokens = typeof colors;
export type TypographyTokens = typeof tokens.typography;
export type SpacingTokens = typeof tokens.spacing;
export type RadiusTokens = typeof radius;
export type ShadowTokens = typeof tokens.shadows;
export type MotionTokens = typeof tokens.motion;
