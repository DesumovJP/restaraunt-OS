/**
 * Restaurant OS Design System
 * Glassmorphism & Visual Effects Tokens
 *
 * Містить:
 * - Glassmorphism варіанти (background, backdrop-filter, border)
 * - Gradient overlays для глибини
 * - GPU-optimization властивості
 * - Fallbacks для старих браузерів
 *
 * Філософія: Сучасний, преміальний look з glassmorphism
 */

// =============================================================================
// GLASSMORPHISM EFFECTS
// =============================================================================

/**
 * Glassmorphism варіанти
 * Використовують backdrop-filter для blur ефекту
 *
 * Fallback стратегія:
 * - Сучасні браузери: blur + saturate
 * - Старі браузери: напівпрозорий solid background
 */
export const glass = {
  // Base - Стандартний glass ефект (70% прозорість, 12px blur)
  base: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)", // Safari support
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 8px 32px rgba(11, 27, 59, 0.08), 0 1px 2px rgba(11, 27, 59, 0.04)",
  },

  // Strong - Сильніший glass (85% прозорість, 16px blur)
  strong: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(16px) saturate(200%)",
    WebkitBackdropFilter: "blur(16px) saturate(200%)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 8px 32px rgba(11, 27, 59, 0.1), 0 2px 4px rgba(11, 27, 59, 0.05)",
  },

  // Subtle - М'який glass (50% прозорість, 8px blur)
  subtle: {
    background: "rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(8px) saturate(150%)",
    WebkitBackdropFilter: "blur(8px) saturate(150%)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 4px 16px rgba(11, 27, 59, 0.06)",
  },

  // Dark - Темний glass (70% navy з прозорістю)
  dark: {
    background: "rgba(11, 27, 59, 0.7)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  },

  // Fallback для старих браузерів (без blur support)
  fallback: {
    background: "rgba(255, 255, 255, 0.95)",
    border: "1px solid rgba(203, 213, 225, 0.3)",
    boxShadow: "0 2px 8px rgba(11, 27, 59, 0.08)",
  },

  // Hover states для interactive glass elements
  hover: {
    base: {
      background: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(14px) saturate(190%)",
      WebkitBackdropFilter: "blur(14px) saturate(190%)",
      border: "1px solid rgba(255, 255, 255, 0.25)",
      boxShadow: "0 12px 40px rgba(11, 27, 59, 0.12), 0 2px 4px rgba(11, 27, 59, 0.06)",
    },
    strong: {
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(18px) saturate(210%)",
      WebkitBackdropFilter: "blur(18px) saturate(210%)",
      border: "1px solid rgba(255, 255, 255, 0.35)",
    },
  },
} as const;

// =============================================================================
// GRADIENT OVERLAYS
// =============================================================================

/**
 * Gradient overlays для додавання глибини та visual interest
 * Використовуються як overlays на backgrounds та cards
 */
export const gradients = {
  // Navy gradients
  navyToTransparent: "linear-gradient(180deg, rgba(11, 27, 59, 0.9) 0%, transparent 100%)",
  navySubtle: "linear-gradient(135deg, rgba(11, 27, 59, 0.05) 0%, transparent 100%)",
  navyRadial: "radial-gradient(circle at top left, rgba(11, 27, 59, 0.1) 0%, transparent 50%)",

  // White gradients
  whiteToTransparent: "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, transparent 100%)",
  whiteSubtle: "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)",

  // Electric blue accent glows
  accentGlow: "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
  accentGlowStrong: "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.25) 0%, transparent 40%)",
  accentHorizontal: "linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)",

  // Slate backgrounds для subtle depth
  slateGradient: "linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 100%)",
  slateDiagonal: "linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(226, 232, 240, 0.5) 100%)",

  // Multi-stop gradients для premium look
  premiumBackground: "linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(255, 255, 255, 1) 50%, rgba(239, 246, 255, 0.5) 100%)",
  heroGradient: "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 50%, rgba(239, 246, 255, 0.3) 100%)",

  // Shimmer effects для loading states
  shimmer: "linear-gradient(90deg, rgba(203, 213, 225, 0.2) 0%, rgba(203, 213, 225, 0.5) 50%, rgba(203, 213, 225, 0.2) 100%)",
  shimmerGold: "linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.3) 50%, rgba(251, 191, 36, 0.1) 100%)",
} as const;

// =============================================================================
// GPU OPTIMIZATION
// =============================================================================

/**
 * GPU-optimized properties для плавних анімацій
 * Використовуються на animated elements для кращої продуктивності
 */
export const gpuOptimized = {
  // Force GPU acceleration
  transform: "translateZ(0)",
  willChange: "transform, opacity",
  backfaceVisibility: "hidden" as const,
  perspective: "1000px",

  // Оптимізація для specific properties
  transformOnly: {
    willChange: "transform",
    transform: "translateZ(0)",
  },

  opacityOnly: {
    willChange: "opacity",
  },

  filterOnly: {
    willChange: "backdrop-filter, filter",
  },

  // Комплексні анімації
  complex: {
    willChange: "transform, opacity, backdrop-filter",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden" as const,
  },

  // Auto - браузер вирішує
  auto: {
    willChange: "auto",
  },
} as const;

// =============================================================================
// BROWSER SUPPORT DETECTION
// =============================================================================

/**
 * Utilities для detection browser capabilities
 * Використовуються для fallbacks
 */
export const browserSupport = {
  // CSS feature detection
  supportsBackdropFilter: () => {
    if (typeof window === "undefined") return false;
    return CSS.supports("backdrop-filter", "blur(12px)") || CSS.supports("-webkit-backdrop-filter", "blur(12px)");
  },

  supportsGridGap: () => {
    if (typeof window === "undefined") return false;
    return CSS.supports("grid-gap", "1rem") || CSS.supports("gap", "1rem");
  },

  // Hardware capabilities
  isLowEndDevice: () => {
    if (typeof navigator === "undefined") return false;
    // Device з ≤4 cores або ≤4GB RAM вважається low-end
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    return cores <= 4 || memory <= 4;
  },

  // Adaptive blur strength на основі hardware
  getAdaptiveBlurStrength: () => {
    if (!browserSupport.supportsBackdropFilter()) return "none";
    if (browserSupport.isLowEndDevice()) return "8px";
    return "12px";
  },
} as const;

// =============================================================================
// ADAPTIVE EFFECTS
// =============================================================================

/**
 * Adaptive effects що підлаштовуються під device capabilities
 */
export const adaptiveEffects = {
  // Blur strength на основі device
  blur: {
    high: "blur(16px)",
    medium: "blur(12px)",
    low: "blur(8px)",
    none: "none",
  },

  // Saturate strength
  saturate: {
    high: "saturate(200%)",
    medium: "saturate(180%)",
    low: "saturate(150%)",
    none: "saturate(100%)",
  },

  // Shadow complexity
  shadow: {
    high: "0 12px 40px rgba(11, 27, 59, 0.15), 0 2px 8px rgba(11, 27, 59, 0.08)",
    medium: "0 8px 32px rgba(11, 27, 59, 0.12), 0 1px 4px rgba(11, 27, 59, 0.06)",
    low: "0 4px 16px rgba(11, 27, 59, 0.08)",
    none: "none",
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type GlassVariant = keyof typeof glass;
export type GradientType = keyof typeof gradients;
export type GPUOptimization = keyof typeof gpuOptimized;

// =============================================================================
// CSS GENERATOR FOR GLASSMORPHISM
// =============================================================================

/**
 * Генерує CSS для glassmorphism effects
 * Використовується в design-system.css
 */
export function generateGlassCSSVariables(): string {
  const lines: string[] = [];

  lines.push(":root {");
  lines.push("  /* Glassmorphism Effects */");

  // Glass base
  lines.push(`  --glass-bg: ${glass.base.background};`);
  lines.push(`  --glass-backdrop: ${glass.base.backdropFilter};`);
  lines.push(`  --glass-border: ${glass.base.border};`);
  lines.push(`  --glass-shadow: ${glass.base.boxShadow};`);

  // Glass variants
  lines.push(`  --glass-strong-bg: ${glass.strong.background};`);
  lines.push(`  --glass-strong-backdrop: ${glass.strong.backdropFilter};`);
  lines.push(`  --glass-subtle-bg: ${glass.subtle.background};`);
  lines.push(`  --glass-subtle-backdrop: ${glass.subtle.backdropFilter};`);
  lines.push(`  --glass-dark-bg: ${glass.dark.background};`);

  // GPU optimization
  lines.push(`  --gpu-transform: ${gpuOptimized.transform};`);
  lines.push(`  --gpu-will-change: ${gpuOptimized.willChange};`);
  lines.push(`  --gpu-backface: ${gpuOptimized.backfaceVisibility};`);

  lines.push("}");

  return lines.join("\n");
}

/**
 * Генерує CSS utility classes для glassmorphism
 */
export function generateGlassUtilityClasses(): string {
  return `
/* Glassmorphism Utilities */
@supports (backdrop-filter: blur(12px)) {
  .glass-base {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-backdrop);
    -webkit-backdrop-filter: var(--glass-backdrop);
    border: var(--glass-border);
    box-shadow: var(--glass-shadow);
  }

  .glass-strong {
    background: var(--glass-strong-bg);
    backdrop-filter: var(--glass-strong-backdrop);
    -webkit-backdrop-filter: var(--glass-strong-backdrop);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .glass-subtle {
    background: var(--glass-subtle-bg);
    backdrop-filter: var(--glass-subtle-backdrop);
    -webkit-backdrop-filter: var(--glass-subtle-backdrop);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .glass-dark {
    background: var(--glass-dark-bg);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

/* Fallback для старих браузерів */
@supports not (backdrop-filter: blur(12px)) {
  .glass-base,
  .glass-strong,
  .glass-subtle {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(203, 213, 225, 0.3);
    box-shadow: 0 2px 8px rgba(11, 27, 59, 0.08);
  }

  .glass-dark {
    background: rgba(11, 27, 59, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}

/* GPU Acceleration Utility */
.gpu-accelerated {
  transform: var(--gpu-transform);
  will-change: var(--gpu-will-change);
  backface-visibility: var(--gpu-backface);
}
  `.trim();
}
