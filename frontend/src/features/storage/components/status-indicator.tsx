"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductStatus, StatusIndicatorProps } from "@/types/storage-ui";
import { STATUS_LABELS } from "@/types/storage-ui";
import type { ExtendedProduct } from "@/types/extended";

// ==========================================
// STATUS CALCULATION
// ==========================================

/**
 * Calculate product status based on stock and expiry
 */
export function getProductStatus(product: {
  currentStock: number;
  minStock: number;
  expiryDate?: string | null;
}): ProductStatus {
  const isLowStock = product.currentStock <= product.minStock;
  const isOutOfStock = product.currentStock === 0;

  const isExpiringSoon =
    product.expiryDate &&
    new Date(product.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const isExpired =
    product.expiryDate && new Date(product.expiryDate) < new Date();

  // Critical: out of stock, expired, or both low stock and expiring
  if (isOutOfStock || isExpired || (isLowStock && isExpiringSoon)) {
    return "critical";
  }

  // Warning: low stock or expiring soon
  if (isLowStock || isExpiringSoon) {
    return "warning";
  }

  return "ok";
}

/**
 * Get status details for tooltip
 */
export function getStatusDetails(product: {
  currentStock: number;
  minStock: number;
  expiryDate?: string | null;
}): string[] {
  const details: string[] = [];

  if (product.currentStock === 0) {
    details.push("Немає в наявності");
  } else if (product.currentStock <= product.minStock) {
    details.push(`Низький запас (мін: ${product.minStock})`);
  }

  if (product.expiryDate) {
    const expiryDate = new Date(product.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      details.push("Прострочено");
    } else if (daysUntilExpiry <= 2) {
      details.push(`Термін закінчується через ${daysUntilExpiry} дн.`);
    } else if (daysUntilExpiry <= 7) {
      details.push(`Термін до ${expiryDate.toLocaleDateString("uk-UA")}`);
    }
  }

  return details;
}

// ==========================================
// STATUS DOT COMPONENT
// ==========================================

const SIZE_CLASSES = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

const STATUS_COLORS: Record<ProductStatus, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  ok: "bg-green-500",
};

/**
 * Minimal status dot indicator
 */
export function StatusDot({
  status,
  size = "md",
  animated = true,
  tooltip,
  className,
}: StatusIndicatorProps & { className?: string }) {
  const dot = (
    <span
      className={cn(
        "rounded-full shrink-0",
        SIZE_CLASSES[size],
        STATUS_COLORS[status],
        animated && status === "critical" && "animate-pulse",
        className
      )}
      aria-label={STATUS_LABELS[status]}
    />
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{dot}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return dot;
}

// ==========================================
// STATUS BADGE COMPONENT
// ==========================================

/**
 * Status badge with optional label
 */
export function StatusBadge({
  status,
  size = "md",
  showLabel = true,
  className,
}: StatusIndicatorProps & { className?: string }) {
  if (!showLabel) {
    return <StatusDot status={status} size={size} />;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        status === "critical" && "text-red-600",
        status === "warning" && "text-amber-600",
        status === "ok" && "text-green-600",
        className
      )}
    >
      <StatusDot status={status} size={size} animated={false} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ==========================================
// PRODUCT STATUS INDICATOR
// ==========================================

interface ProductStatusIndicatorProps {
  product: {
    currentStock: number;
    minStock: number;
    expiryDate?: string | null;
  };
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

/**
 * Complete status indicator for a product with automatic status calculation
 */
export function ProductStatusIndicator({
  product,
  size = "md",
  showTooltip = true,
  className,
}: ProductStatusIndicatorProps) {
  const status = getProductStatus(product);
  const details = getStatusDetails(product);

  const tooltipContent =
    showTooltip && details.length > 0 ? details.join(" • ") : undefined;

  return (
    <StatusDot
      status={status}
      size={size}
      tooltip={tooltipContent}
      animated={status === "critical"}
      className={className}
    />
  );
}
