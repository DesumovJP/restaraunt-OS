import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price in UAH
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

// Format time duration
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "щойно";
  if (diffMins < 60) return `${diffMins} хв тому`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} год тому`;

  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
  }).format(date);
}

// Format time in 12-hour format (e.g., "06:12 PM")
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Calculate percentage change
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// Group array by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

// Sort by date (newest first)
export function sortByDate<T extends { createdAt: Date }>(
  items: T[],
  order: "asc" | "desc" = "desc"
): T[] {
  return [...items].sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return order === "desc" ? diff : -diff;
  });
}

// Calculate recipe cost
export function calculateRecipeCost(
  ingredients: Array<{ quantity: number; product: { currentStock: number } }>,
  productPrices: Map<string, number>
): number {
  return ingredients.reduce((total, ing) => {
    const price = productPrices.get(ing.product.currentStock.toString()) || 0;
    return total + ing.quantity * price;
  }, 0);
}

// FIFO calculation for write-offs
export function calculateFIFOCost(
  supplies: Array<{ quantity: number; unitPrice: number; receivedAt: Date }>,
  quantityToWriteOff: number
): { cost: number; batches: Array<{ quantity: number; unitPrice: number }> } {
  const sortedSupplies = [...supplies].sort(
    (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  );

  let remaining = quantityToWriteOff;
  let totalCost = 0;
  const batches: Array<{ quantity: number; unitPrice: number }> = [];

  for (const supply of sortedSupplies) {
    if (remaining <= 0) break;

    const quantityFromBatch = Math.min(remaining, supply.quantity);
    totalCost += quantityFromBatch * supply.unitPrice;
    batches.push({ quantity: quantityFromBatch, unitPrice: supply.unitPrice });
    remaining -= quantityFromBatch;
  }

  return { cost: totalCost, batches };
}
