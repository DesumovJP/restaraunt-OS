"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { StatusDot, getProductStatus } from "../components/status-indicator";
import type { ExtendedProduct } from "@/types/extended";

// ==========================================
// COMPACT PRODUCT CARD
// ==========================================

interface ProductCardCompactProps {
  product: ExtendedProduct;
  onSelect?: (product: ExtendedProduct) => void;
  onEdit?: () => void;
  onUse?: () => void;
  onWriteOff?: () => void;
  selected?: boolean;
  className?: string;
}

/**
 * Compact product card - single row, dense information
 * Optimized for long lists and quick scanning
 */
export function ProductCardCompact({
  product,
  onSelect,
  selected,
  className,
}: ProductCardCompactProps) {
  const status = getProductStatus(product);
  const stockPercentage = Math.round(
    (product.currentStock / product.maxStock) * 100
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-2.5 cursor-pointer transition-all",
        "hover:bg-muted/50 active:bg-muted/80 touch-feedback",
        "min-h-[52px] sm:min-h-[44px]", // Touch-friendly minimum height
        selected && "bg-primary/5 border-l-2 border-primary",
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
      {/* Status indicator - larger for visibility */}
      <StatusDot status={status} size="sm" />

      {/* Name - takes most space */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm sm:text-base truncate block leading-tight">{product.name}</span>
        {/* Category - shown below name on mobile */}
        <span className="text-xs text-muted-foreground sm:hidden truncate block mt-0.5">
          {product.category}
        </span>
      </div>

      {/* Category - hidden on mobile, shown on sm+ */}
      <span className="text-xs text-muted-foreground hidden sm:block w-24 truncate">
        {product.category}
      </span>

      {/* Stock with mini progress */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden xs:block">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              status === "critical" && "bg-red-500",
              status === "warning" && "bg-amber-500",
              status === "ok" && "bg-green-500"
            )}
            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
          />
        </div>
        <span className="text-sm font-semibold tabular-nums min-w-[60px] text-right">
          {product.currentStock} {product.unit}
        </span>
      </div>

      {/* Arrow - larger touch area */}
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </div>
  );
}
