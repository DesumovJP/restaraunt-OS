/**
 * Restaurant OS Design System
 * Motion Tokens
 *
 * Філософія: "Purposeful Motion"
 * - Анімації мають мету, не декоративні
 * - Швидкі та чуйні (не як повільні у Toast)
 * - Поважають reduced-motion preferences
 *
 * Переваги над конкурентами:
 * - Toast: швидші, менш відволікаючі
 * - Square: більше personality
 * - Lightspeed: взагалі є анімації (у них немає)
 */

// =============================================================================
// DURATION SCALE
// =============================================================================

export const duration = {
  // Instant - для hover states
  instant: "0ms",
  fastest: "50ms",
  faster: "100ms",
  fast: "150ms",

  // Normal - для більшості transitions
  normal: "200ms",
  moderate: "250ms",

  // Slow - для появи елементів
  slow: "300ms",
  slower: "400ms",
  slowest: "500ms",

  // Long - для складних анімацій
  long: "700ms",
  longer: "1000ms",
} as const;

// =============================================================================
// EASING FUNCTIONS
// Засновано на iOS/Material Design guidelines
// =============================================================================

export const easing = {
  // Standard easings
  linear: "linear",

  // Ease out - для входу елементів (швидкий старт, повільне закінчення)
  easeOut: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  easeOutQuart: "cubic-bezier(0.25, 1, 0.5, 1)",
  easeOutExpo: "cubic-bezier(0.16, 1, 0.3, 1)",

  // Ease in - для виходу елементів (повільний старт, швидке закінчення)
  easeIn: "cubic-bezier(0.4, 0.0, 1, 1)",
  easeInQuart: "cubic-bezier(0.5, 0, 0.75, 0)",

  // Ease in out - для переходів на місці
  easeInOut: "cubic-bezier(0.4, 0.0, 0.2, 1)",
  easeInOutQuart: "cubic-bezier(0.76, 0, 0.24, 1)",

  // Spring-like - для "живих" анімацій
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",

  // Emphasized - для важливих дій
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  emphasizedDecelerate: "cubic-bezier(0.05, 0.7, 0.1, 1.0)",
  emphasizedAccelerate: "cubic-bezier(0.3, 0.0, 0.8, 0.15)",
} as const;

// =============================================================================
// SEMANTIC TRANSITIONS
// =============================================================================

export const transitions = {
  // Micro interactions
  micro: {
    fast: `all ${duration.fast} ${easing.easeOut}`,
    normal: `all ${duration.normal} ${easing.easeOut}`,
  },

  // Color transitions
  color: {
    fast: `color ${duration.fast} ${easing.easeOut}, background-color ${duration.fast} ${easing.easeOut}, border-color ${duration.fast} ${easing.easeOut}`,
    normal: `color ${duration.normal} ${easing.easeOut}, background-color ${duration.normal} ${easing.easeOut}, border-color ${duration.normal} ${easing.easeOut}`,
  },

  // Transform transitions
  transform: {
    fast: `transform ${duration.fast} ${easing.easeOut}`,
    normal: `transform ${duration.normal} ${easing.spring}`,
    slow: `transform ${duration.slow} ${easing.spring}`,
  },

  // Opacity transitions
  opacity: {
    fast: `opacity ${duration.fast} ${easing.easeOut}`,
    normal: `opacity ${duration.normal} ${easing.easeOut}`,
  },

  // Size transitions
  size: {
    normal: `width ${duration.normal} ${easing.easeInOut}, height ${duration.normal} ${easing.easeInOut}`,
    slow: `width ${duration.slow} ${easing.easeInOut}, height ${duration.slow} ${easing.easeInOut}`,
  },

  // Shadow transitions
  shadow: {
    normal: `box-shadow ${duration.normal} ${easing.easeOut}`,
  },

  // Combined - for buttons, cards
  interactive: `background-color ${duration.fast} ${easing.easeOut}, border-color ${duration.fast} ${easing.easeOut}, box-shadow ${duration.fast} ${easing.easeOut}, transform ${duration.fast} ${easing.easeOut}`,
} as const;

// =============================================================================
// KEYFRAME ANIMATIONS
// =============================================================================

export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // Slide animations
  slideInFromRight: {
    from: { transform: "translateX(100%)", opacity: 0 },
    to: { transform: "translateX(0)", opacity: 1 },
  },
  slideOutToRight: {
    from: { transform: "translateX(0)", opacity: 1 },
    to: { transform: "translateX(100%)", opacity: 0 },
  },
  slideInFromBottom: {
    from: { transform: "translateY(100%)", opacity: 0 },
    to: { transform: "translateY(0)", opacity: 1 },
  },
  slideInFromTop: {
    from: { transform: "translateY(-20px)", opacity: 0 },
    to: { transform: "translateY(0)", opacity: 1 },
  },

  // Scale animations
  scaleIn: {
    from: { transform: "scale(0.95)", opacity: 0 },
    to: { transform: "scale(1)", opacity: 1 },
  },
  scaleOut: {
    from: { transform: "scale(1)", opacity: 1 },
    to: { transform: "scale(0.95)", opacity: 0 },
  },

  // Pulse (for live indicators)
  pulse: {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.5 },
  },
  pulseSoft: {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.7 },
  },

  // Shake (for errors)
  shake: {
    "0%, 100%": { transform: "translateX(0)" },
    "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
    "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
  },

  // Bounce (for success)
  bounce: {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-10px)" },
  },

  // Spin (for loading)
  spin: {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },

  // Progress shimmer
  shimmer: {
    "0%": { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition: "200% 0" },
  },
} as const;

// =============================================================================
// ANIMATION PRESETS
// =============================================================================

export const animations = {
  fadeIn: `fadeIn ${duration.normal} ${easing.easeOut}`,
  fadeOut: `fadeOut ${duration.fast} ${easing.easeIn}`,
  slideInRight: `slideInFromRight ${duration.slow} ${easing.easeOutExpo}`,
  slideOutRight: `slideOutToRight ${duration.normal} ${easing.easeIn}`,
  slideInBottom: `slideInFromBottom ${duration.slow} ${easing.easeOutExpo}`,
  slideInTop: `slideInFromTop ${duration.normal} ${easing.easeOut}`,
  scaleIn: `scaleIn ${duration.normal} ${easing.spring}`,
  scaleOut: `scaleOut ${duration.fast} ${easing.easeIn}`,
  pulse: `pulse 2s ${easing.easeInOut} infinite`,
  pulseSoft: `pulseSoft 2s ${easing.easeInOut} infinite`,
  shake: `shake ${duration.slow} ${easing.easeInOut}`,
  bounce: `bounce ${duration.slow} ${easing.spring}`,
  spin: `spin 1s ${easing.linear} infinite`,
  shimmer: `shimmer 2s ${easing.linear} infinite`,
} as const;

// =============================================================================
// CSS GENERATOR
// =============================================================================

export function generateMotionCSSVariables(): string {
  const keyframeCSS = Object.entries(keyframes)
    .map(([name, frames]) => {
      const frameCSS = Object.entries(frames)
        .map(([key, value]) => {
          const props = Object.entries(value as Record<string, string>)
            .map(([prop, val]) => `    ${prop}: ${val};`)
            .join("\n");
          return `  ${key} {\n${props}\n  }`;
        })
        .join("\n");
      return `@keyframes ${name} {\n${frameCSS}\n}`;
    })
    .join("\n\n");

  return `
/* Durations */
:root {
  --duration-instant: ${duration.instant};
  --duration-fast: ${duration.fast};
  --duration-normal: ${duration.normal};
  --duration-slow: ${duration.slow};
}

/* Easings */
:root {
  --ease-out: ${easing.easeOut};
  --ease-in: ${easing.easeIn};
  --ease-in-out: ${easing.easeInOut};
  --ease-spring: ${easing.spring};
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

${keyframeCSS}
  `.trim();
}

// Type exports
export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
export type Animation = keyof typeof animations;
