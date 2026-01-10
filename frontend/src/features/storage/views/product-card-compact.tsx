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
        "flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors",
        "hover:bg-muted/50 active:bg-muted",
        selected && "bg-primary/5",
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
      {/* Status indicator */}
      <StatusDot status={status} size="sm" />

      {/* Name - takes most space */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block">{product.name}</span>
      </div>

      {/* Category - hidden on very small screens */}
      <span className="text-xs text-muted-foreground hidden sm:block w-24 truncate">
        {product.category}
      </span>

      {/* Stock with mini progress */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden hidden xs:block">
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
        <span className="text-sm font-medium tabular-nums w-16 text-right">
          {product.currentStock} {product.unit}
        </span>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}
