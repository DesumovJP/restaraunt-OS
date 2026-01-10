"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { getProductStatus } from "../components/status-indicator";
import type { ExtendedProduct } from "@/types/extended";

// ==========================================
// COMFORTABLE PRODUCT CARD
// ==========================================

interface ProductCardComfortableProps {
  product: ExtendedProduct;
  onSelect?: (product: ExtendedProduct) => void;
  onEdit?: () => void;
  onUse?: () => void;
  onWriteOff?: () => void;
  selected?: boolean;
  className?: string;
}

/**
 * Comfortable product card - information-dense card
 * Optimized for grid layouts with visual hierarchy
 */
export function ProductCardComfortable({
  product,
  onSelect,
  selected,
  className,
}: ProductCardComfortableProps) {
  const status = getProductStatus(product);
  const stockPercentage = Math.min(
    Math.round((product.currentStock / product.maxStock) * 100),
    100
  );

  // Calculate days until expiry
  const daysUntilExpiry = product.expiryDate
    ? Math.ceil(
        (new Date(product.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isLowStock = product.currentStock <= product.minStock;

  return (
    <div
      className={cn(
        "relative border rounded-lg p-3 cursor-pointer transition-all",
        "hover:shadow-md hover:border-primary/30 active:scale-[0.99]",
        selected && "ring-2 ring-primary border-primary",
        status === "critical" && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
        status === "warning" && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20",
        className
      )}
      onClick={() => onSelect?.(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(product);
        }
      }}
    >
      {/* Header: Name + Category */}
      <div className="mb-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {product.category}
        </p>
      </div>

      {/* Stock display */}
      <div className="flex items-end justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-2xl font-bold tabular-nums",
              status === "critical" && "text-red-600",
              status === "warning" && "text-amber-600"
            )}
          >
            {product.currentStock}
          </span>
          <span className="text-sm text-muted-foreground">
            {product.unit}
          </span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          мін {product.minStock}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            stockPercentage <= 20 && "bg-red-500",
            stockPercentage > 20 && stockPercentage <= 40 && "bg-amber-500",
            stockPercentage > 40 && "bg-green-500"
          )}
          style={{ width: `${stockPercentage}%` }}
        />
      </div>

      {/* Freshness bar (if has expiry) */}
      {daysUntilExpiry !== null && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground shrink-0">Свіжість</span>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                daysUntilExpiry <= 0 && "bg-red-500",
                daysUntilExpiry > 0 && daysUntilExpiry <= 3 && "bg-red-500",
                daysUntilExpiry > 3 && daysUntilExpiry <= 7 && "bg-amber-500",
                daysUntilExpiry > 7 && "bg-green-500"
              )}
              style={{
                width: `${Math.max(0, Math.min(100, (daysUntilExpiry / (product.shelfLifeDays || 14)) * 100))}%`,
              }}
            />
          </div>
          <span
            className={cn(
              "text-xs font-medium tabular-nums shrink-0",
              daysUntilExpiry <= 0 && "text-red-600",
              daysUntilExpiry > 0 && daysUntilExpiry <= 3 && "text-red-600",
              daysUntilExpiry > 3 && daysUntilExpiry <= 7 && "text-amber-600",
              daysUntilExpiry > 7 && "text-green-600"
            )}
          >
            {daysUntilExpiry <= 0 ? "!" : `${daysUntilExpiry}д`}
          </span>
        </div>
      )}

      {/* Footer: Alerts or SKU + Price */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isLowStock && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Низький</span>
            </span>
          )}
          {!isLowStock && (
            <span className="text-muted-foreground">{product.sku}</span>
          )}
        </div>
        <span className="font-medium text-muted-foreground">
          {product.costPerUnit.toFixed(0)} ₴
        </span>
      </div>
    </div>
  );
}
