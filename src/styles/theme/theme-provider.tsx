"use client";

import * as React from "react";
import { tokens, type Tokens } from "@/styles/tokens";

// =============================================================================
// THEME CONTEXT
// =============================================================================

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: "light" | "dark";
  tokens: Tokens;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

// =============================================================================
// THEME PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultMode = "light",
  storageKey = "restaurant-os-theme",
}: ThemeProviderProps) {
  const [mode, setModeState] = React.useState<ThemeMode>(defaultMode);
  const [resolvedMode, setResolvedMode] = React.useState<"light" | "dark">("light");

  // Initialize from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as ThemeMode | null;
    if (stored) {
      setModeState(stored);
    }
  }, [storageKey]);

  // Resolve system preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedMode = () => {
      if (mode === "system") {
        setResolvedMode(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedMode(mode);
      }
    };

    updateResolvedMode();
    mediaQuery.addEventListener("change", updateResolvedMode);

    return () => mediaQuery.removeEventListener("change", updateResolvedMode);
  }, [mode]);

  // Apply theme to document
  React.useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Add current theme class
    root.classList.add(resolvedMode);

    // Set color-scheme for native elements
    root.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  // Set mode handler
  const setMode = React.useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode);
      localStorage.setItem(storageKey, newMode);
    },
    [storageKey]
  );

  const value: ThemeContextValue = React.useMemo(
    () => ({
      mode,
      setMode,
      resolvedMode,
      tokens,
    }),
    [mode, setMode, resolvedMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { mode, setMode } = useTheme();

  const cycleMode = () => {
    const modes: ThemeMode[] = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  };

  return (
    <button
      onClick={cycleMode}
      className={className}
      aria-label={`Current theme: ${mode}. Click to change.`}
    >
      {mode === "light" && "☀️"}
      {mode === "dark" && "🌙"}
      {mode === "system" && "💻"}
    </button>
  );
}

// =============================================================================
// CSS-IN-JS HELPER
// =============================================================================

/**
 * Get a token value for use in inline styles or CSS-in-JS
 */
export function getToken<T extends keyof Tokens>(
  category: T,
  ...path: string[]
): string {
  let value: unknown = tokens[category];

  for (const key of path) {
    if (typeof value === "object" && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      console.warn(`Token not found: ${category}.${path.join(".")}`);
      return "";
    }
  }

  return value as string;
}
