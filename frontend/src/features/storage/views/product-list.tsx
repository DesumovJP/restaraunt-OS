"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ProductCardComfortable } from "./product-card-comfortable";
import { ProductsTable } from "./products-table";
import type { ViewMode, StorageUIState } from "@/types/storage-ui";
import type { ExtendedProduct } from "@/types/extended";

// ==========================================
// PRODUCT LIST
// ==========================================

interface ProductListProps {
  products: ExtendedProduct[];
  viewMode: ViewMode;
  sortBy: StorageUIState["sortBy"];
  sortOrder: "asc" | "desc";
  onSort: (field: StorageUIState["sortBy"]) => void;
  onSelect: (product: ExtendedProduct) => void;
  onEdit?: (product: ExtendedProduct) => void;
  onUse?: (product: ExtendedProduct) => void;
  onWriteOff?: (product: ExtendedProduct) => void;
  selectedId?: string;
  className?: string;
}

/**
 * Unified product list that renders based on view mode
 */
export function ProductList({
  products,
  viewMode,
  sortBy,
  sortOrder,
  onSort,
  onSelect,
  onEdit,
  onUse,
  onWriteOff,
  selectedId,
  className,
}: ProductListProps) {
  // Table view
  if (viewMode === "table") {
    return (
      <ProductsTable
        products={products}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        onSelect={onSelect}
        onEdit={onEdit}
        onUse={onUse}
        onWriteOff={onWriteOff}
        selectedId={selectedId}
        className={className}
      />
    );
  }

  // Cards view (default) - responsive grid
  return (
    <div
      className={cn(
        "grid gap-3",
        "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
        className
      )}
    >
      {products.map((product) => (
        <ProductCardComfortable
          key={product.documentId}
          product={product}
          onSelect={onSelect}
          onEdit={onEdit ? () => onEdit(product) : undefined}
          onUse={onUse ? () => onUse(product) : undefined}
          onWriteOff={onWriteOff ? () => onWriteOff(product) : undefined}
          selected={selectedId === product.documentId}
        />
      ))}
    </div>
  );
}

// ==========================================
// PRODUCT LIST SKELETON
// ==========================================

interface ProductListSkeletonProps {
  viewMode: ViewMode;
  count?: number;
}

export function ProductListSkeleton({
  viewMode,
  count = 12,
}: ProductListSkeletonProps) {
  if (viewMode === "table") {
    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header skeleton */}
        <div className="bg-muted/50 border-b px-3 py-2.5 flex gap-4">
          <div className="w-6 h-4 bg-muted rounded animate-pulse" />
          <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
          <div className="w-24 h-4 bg-muted rounded animate-pulse hidden md:block" />
          <div className="w-32 h-4 bg-muted rounded animate-pulse" />
          <div className="w-20 h-4 bg-muted rounded animate-pulse hidden lg:block" />
          <div className="w-24 h-4 bg-muted rounded animate-pulse hidden sm:block" />
        </div>
        {/* Rows skeleton */}
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-3 py-2.5 border-b animate-pulse"
          >
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4 mb-1" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
            <div className="w-20 h-4 bg-muted rounded hidden md:block" />
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-muted rounded" />
              <div className="w-16 h-1.5 bg-muted rounded-full" />
            </div>
            <div className="w-16 h-4 bg-muted rounded hidden lg:block" />
            <div className="w-20 h-4 bg-muted rounded hidden sm:block" />
          </div>
        ))}
      </div>
    );
  }

  // Cards skeleton - responsive grid
  return (
    <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-3 animate-pulse">
          {/* Header */}
          <div className="mb-2">
            <div className="h-4 bg-muted rounded w-3/4 mb-1" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
          {/* Stock */}
          <div className="flex items-end justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <div className="h-7 w-12 bg-muted rounded" />
              <div className="h-4 w-8 bg-muted rounded" />
            </div>
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
          {/* Progress */}
          <div className="h-1.5 bg-muted rounded-full mb-2" />
          {/* Footer */}
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
