"use client";

import * as React from "react";
import type { ViewMode } from "@/types/storage-ui";

interface UseKeyboardNavigationOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onClose: () => void;
  isOpen: boolean;
  enabled?: boolean;
}

/**
 * Keyboard navigation for product lists
 *
 * Keys:
 * - ↑/↓: Navigate items
 * - Enter/Space: Open preview
 * - Escape: Close preview
 * - 1/2/3: Switch view mode (if handler provided)
 * - /: Focus search
 */
export function useKeyboardNavigation<T>({
  items,
  getItemId,
  selectedId,
  onSelect,
  onOpen,
  onClose,
  isOpen,
  enabled = true,
}: UseKeyboardNavigationOptions<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if focus is in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only handle Escape to close preview
        if (e.key === "Escape" && isOpen) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      const currentIndex = selectedId
        ? items.findIndex((item) => getItemId(item) === selectedId)
        : -1;

      switch (e.key) {
        case "ArrowDown":
        case "j":
          e.preventDefault();
          if (items.length > 0) {
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            onSelect(getItemId(items[nextIndex]));
          }
          break;

        case "ArrowUp":
        case "k":
          e.preventDefault();
          if (items.length > 0) {
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            onSelect(getItemId(items[prevIndex]));
          }
          break;

        case "Enter":
        case " ":
          if (selectedId && !isOpen) {
            e.preventDefault();
            onOpen(selectedId);
          }
          break;

        case "Escape":
          if (isOpen) {
            e.preventDefault();
            onClose();
          }
          break;

        case "/":
          // Focus search - let the page handle this
          break;

        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, items, getItemId, selectedId, isOpen, onSelect, onOpen, onClose]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (!selectedId || !containerRef.current) return;

    const selectedElement = containerRef.current.querySelector(
      `[data-item-id="${selectedId}"]`
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedId]);

  return { containerRef };
}

/**
 * Hook for view mode keyboard shortcuts
 */
export function useViewModeShortcuts(
  setViewMode: (mode: ViewMode) => void,
  enabled = true
) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if focus is in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "1":
          e.preventDefault();
          setViewMode("cards");
          break;
        case "2":
          e.preventDefault();
          setViewMode("table");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, setViewMode]);
}

/**
 * Hook for search focus shortcut
 */
export function useSearchShortcut(
  searchInputRef: React.RefObject<HTMLInputElement>,
  enabled = true
) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle / when not in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, searchInputRef]);
}
