/**
 * Formatters
 *
 * Centralized formatting utilities for dates, times, durations, and currency.
 * Used across the application for consistent display formatting.
 */

/**
 * Format duration in milliseconds to MM:SS format
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "5:30"
 */
export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format duration in seconds to a human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "5м 30с" or "30с"
 */
export function formatDurationSeconds(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}с`;
  return `${mins}м ${secs}с`;
}

/**
 * Format duration in milliseconds to a human-readable format with Ukrainian labels
 * @param ms - Duration in milliseconds
 * @returns Formatted string like "1г 30хв" or "45хв"
 */
export function formatDurationMsHuman(ms: number): string {
  if (isNaN(ms) || ms < 0) return "";

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}г ${minutes}хв`;
  }
  return `${minutes}хв`;
}

/**
 * Format currency amount in UAH
 * @param amount - Amount to format
 * @returns Formatted string like "₴123.45"
 */
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "—";
  return `₴${amount.toFixed(2)}`;
}

/**
 * Format date to Ukrainian locale string
 * @param dateStr - ISO date string
 * @returns Formatted date string like "01.01.2024, 12:30:45"
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format date to Ukrainian locale date only
 * @param dateStr - ISO date string
 * @returns Formatted date string like "01.01.2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format time only
 * @param dateStr - ISO date string
 * @returns Formatted time string like "12:30:45"
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format time ago in Ukrainian
 * @param dateStr - ISO date string
 * @returns Formatted string like "5 хв тому" or full date if older than a week
 */
export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "щойно";
  if (diffMins < 60) return `${diffMins} хв тому`;
  if (diffHours < 24) return `${diffHours} год тому`;
  if (diffDays < 7) return `${diffDays} дн тому`;
  return formatDateTime(dateStr);
}

/**
 * Format current time in HH:MM format
 * @returns Current time string like "12:30"
 */
export function formatCurrentTime(): string {
  return new Date().toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format table session time from occupied timestamp
 * @param occupiedAt - ISO date string when table was occupied
 * @returns Formatted string like "1г 30хв" or "45хв"
 */
export function formatTableSessionTime(occupiedAt: string): string {
  const start = new Date(occupiedAt).getTime();
  const now = Date.now();
  const diff = now - start;

  if (isNaN(diff) || diff < 0) return "";

  return formatDurationMsHuman(diff);
}

/**
 * Format quantity with unit
 * @param quantity - Numeric quantity
 * @param unit - Unit string
 * @returns Formatted string like "1.5 kg"
 */
export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity} ${unit}`;
}

/**
 * Format weight in grams or kilograms
 * @param grams - Weight in grams
 * @returns Formatted string like "1.5 кг" or "500 г"
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} кг`;
  }
  return `${Math.round(grams)} г`;
}
