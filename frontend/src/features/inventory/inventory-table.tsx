"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Search, AlertTriangle, Package, Clock } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/types";

interface InventoryTableProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onProductSelect?: (product: Product) => void;
  className?: string;
}

export function InventoryTable({
  products,
  searchQuery,
  onSearchChange,
  onProductSelect,
  className,
}: InventoryTableProps) {
  // Filter products by search
  const filteredProducts = React.useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Пошук по назві або SKU..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Пошук товарів"
        />
      </div>

      {/* Products list */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          type={searchQuery ? "search" : "inventory"}
          title={searchQuery ? "Нічого не знайдено" : "Склад порожній"}
        />
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onProductSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual product card
interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

function ProductCard({ product, onSelect }: ProductCardProps) {
  const maxStock = product.maxStock ?? 100;
  const minStock = product.minStock ?? 0;
  const currentStock = product.currentStock ?? 0;
  const stockPercentage = Math.min(
    (currentStock / maxStock) * 100,
    100
  );
  const isLowStock = currentStock <= minStock;
  const isExpiring =
    product.expiryDate &&
    new Date(product.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-card-hover active:scale-[0.99]",
        isLowStock && "border-warning",
        isExpiring && "border-danger"
      )}
      onClick={() => onSelect?.(product)}
      role="button"
      tabIndex={0}
      aria-label={`${product.name}, залишок ${product.currentStock} ${product.unit}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Product image thumbnail */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="80px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.image-fallback');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div className={cn(
              "image-fallback absolute inset-0 flex items-center justify-center",
              product.imageUrl ? "hidden" : "flex"
            )}>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  {isLowStock && (
                    <Badge variant="warning" className="shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Низький запас
                    </Badge>
                  )}
                  {isExpiring && (
                    <Badge variant="destructive" className="shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      Термін
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  SKU: {product.sku} • {product.category}
                </p>
              </div>

              {/* Stock info */}
              <div className="text-right shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{product.currentStock}</span>
                  <span className="text-sm text-muted-foreground">{product.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  мін: {product.minStock} / макс: {product.maxStock}
                </p>
              </div>
            </div>

            {/* Stock progress bar */}
            <div className="mt-2">
              <Progress
                value={stockPercentage}
                className="h-2"
                indicatorClassName={cn(
                  stockPercentage <= 20
                    ? "bg-danger"
                    : stockPercentage <= 40
                      ? "bg-warning"
                      : "bg-success"
                )}
              />
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Оновлено: {product.lastUpdated ? formatRelativeTime(new Date(product.lastUpdated)) : "—"}</span>
              {product.expiryDate && (
                <span
                  className={cn(isExpiring && "text-danger font-medium")}
                >
                  До: {new Date(product.expiryDate).toLocaleDateString("uk-UA")}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
