"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import { getProductStatus } from "../components/status-indicator";
import type { ExtendedProduct } from "@/types/extended";
import type { StorageUIState } from "@/types/storage-ui";

// ==========================================
// TYPES
// ==========================================

type SortField = StorageUIState["sortBy"];

interface ProductsTableProps {
  products: ExtendedProduct[];
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  onSort: (field: SortField) => void;
  onSelect: (product: ExtendedProduct) => void;
  onEdit?: (product: ExtendedProduct) => void;
  onUse?: (product: ExtendedProduct) => void;
  onWriteOff?: (product: ExtendedProduct) => void;
  selectedId?: string;
  className?: string;
}

// ==========================================
// SORT HEADER
// ==========================================

interface SortHeaderProps {
  field: SortField;
  currentField: SortField;
  order: "asc" | "desc";
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  align?: "left" | "right";
}

function SortHeader({
  field,
  currentField,
  order,
  onSort,
  children,
  align = "left",
}: SortHeaderProps) {
  const isActive = field === currentField;

  return (
    <button
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors",
        "hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
        align === "right" && "justify-end w-full"
      )}
      onClick={() => onSort(field)}
    >
      {children}
      {isActive ? (
        order === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

// ==========================================
// STATUS CELL
// ==========================================

function StatusCell({ product }: { product: ExtendedProduct }) {
  const status = getProductStatus(product);
  const isLowStock = product.currentStock <= product.minStock;

  if (status === "ok") {
    return <span className="text-xs text-green-600 font-medium">Норма</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {isLowStock && (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          Низький запас
        </span>
      )}
    </div>
  );
}

// ==========================================
// FRESHNESS CELL
// ==========================================

function FreshnessCell({ product }: { product: ExtendedProduct }) {
  // Calculate days until expiry
  const daysUntilExpiry = product.expiryDate
    ? Math.ceil(
        (new Date(product.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Calculate freshness percentage based on shelf life
  // 100% = just received, 0% = expired
  const freshnessPercent =
    daysUntilExpiry !== null && product.shelfLifeDays > 0
      ? Math.max(0, Math.min(100, (daysUntilExpiry / product.shelfLifeDays) * 100))
      : null;

  // No expiry date - show shelf life info or N/A
  if (daysUntilExpiry === null) {
    return (
      <span className="text-xs text-muted-foreground">
        {product.shelfLifeDays > 0 ? `${product.shelfLifeDays} дн.` : "—"}
      </span>
    );
  }

  // Expired
  if (daysUntilExpiry <= 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-red-200 rounded-full overflow-hidden">
          <div className="h-full w-full bg-red-500 rounded-full" />
        </div>
        <span className="text-xs font-medium text-red-600">Прострочено</span>
      </div>
    );
  }

  // Active - show freshness bar
  const getColor = () => {
    if (freshnessPercent === null) return "bg-gray-400";
    if (freshnessPercent >= 50) return "bg-green-500";
    if (freshnessPercent >= 25) return "bg-amber-500";
    return "bg-red-500";
  };

  const getTextColor = () => {
    if (freshnessPercent === null) return "text-muted-foreground";
    if (freshnessPercent >= 50) return "text-green-600";
    if (freshnessPercent >= 25) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", getColor())}
          style={{ width: `${freshnessPercent ?? 0}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", getTextColor())}>
        {daysUntilExpiry} дн.
      </span>
    </div>
  );
}

// ==========================================
// STOCK CELL
// ==========================================

function StockCell({ product }: { product: ExtendedProduct }) {
  const status = getProductStatus(product);
  const percentage = Math.min(
    Math.round((product.currentStock / product.maxStock) * 100),
    100
  );

  return (
    <div className="flex items-center gap-3">
      {/* Progress bar + percentage first */}
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              percentage <= 20 && "bg-red-500",
              percentage > 20 && percentage <= 40 && "bg-amber-500",
              percentage > 40 && "bg-green-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums w-8">
          {percentage}%
        </span>
      </div>
      {/* Quantity on the right */}
      <div className="min-w-[70px]">
        <span
          className={cn(
            "font-semibold tabular-nums",
            status === "critical" && "text-red-600",
            status === "warning" && "text-amber-600"
          )}
        >
          {product.currentStock}
        </span>
        <span className="text-muted-foreground text-xs ml-0.5">
          {product.unit}
        </span>
      </div>
    </div>
  );
}

// ==========================================
// TABLE ROW
// ==========================================

interface TableRowProps {
  product: ExtendedProduct;
  onSelect: () => void;
  selected?: boolean;
}

function ProductTableRow({ product, onSelect, selected }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b cursor-pointer transition-colors",
        "hover:bg-muted/50",
        selected && "bg-primary/5"
      )}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Checkbox */}
      <td className="py-2.5 px-3 w-10">
        <Checkbox
          checked={selected}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          aria-label={`Вибрати ${product.name}`}
        />
      </td>

      {/* Name + SKU */}
      <td className="py-2.5 px-3">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate max-w-[200px]">
            {product.name}
          </div>
          <div className="text-xs text-muted-foreground">{product.sku}</div>
        </div>
      </td>

      {/* Category */}
      <td className="py-2.5 px-3 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">{product.category}</span>
      </td>

      {/* Stock */}
      <td className="py-2.5 px-3">
        <StockCell product={product} />
      </td>

      {/* Min/Max */}
      <td className="py-2.5 px-3 hidden lg:table-cell">
        <div className="text-sm text-muted-foreground tabular-nums">
          <span>{product.minStock}</span>
          <span className="mx-1">/</span>
          <span>{product.maxStock}</span>
        </div>
      </td>

      {/* Freshness */}
      <td className="py-2.5 px-3 hidden sm:table-cell">
        <FreshnessCell product={product} />
      </td>

      {/* Status */}
      <td className="py-2.5 px-3 hidden lg:table-cell">
        <StatusCell product={product} />
      </td>

      {/* Price */}
      <td className="py-2.5 px-3 text-right hidden xl:table-cell">
        <span className="text-sm font-medium tabular-nums">
          {product.costPerUnit.toFixed(2)} ₴
        </span>
      </td>

      {/* Total value */}
      <td className="py-2.5 px-3 text-right hidden xl:table-cell">
        <span className="text-sm text-muted-foreground tabular-nums">
          {(product.currentStock * product.costPerUnit).toFixed(0)} ₴
        </span>
      </td>
    </tr>
  );
}

// ==========================================
// MAIN TABLE COMPONENT
// ==========================================

export function ProductsTable({
  products,
  sortBy,
  sortOrder,
  onSort,
  onSelect,
  selectedId,
  className,
}: ProductsTableProps) {
  const totalValue = products.reduce(
    (sum, p) => sum + p.currentStock * p.costPerUnit,
    0
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="py-2.5 px-3 w-10">
                <Checkbox aria-label="Вибрати всі" />
              </th>
              <th className="py-2.5 px-3 text-left">
                <SortHeader
                  field="name"
                  currentField={sortBy}
                  order={sortOrder}
                  onSort={onSort}
                >
                  Продукт
                </SortHeader>
              </th>
              <th className="py-2.5 px-3 text-left hidden md:table-cell">
                <SortHeader
                  field="category"
                  currentField={sortBy}
                  order={sortOrder}
                  onSort={onSort}
                >
                  Категорія
                </SortHeader>
              </th>
              <th className="py-2.5 px-3 text-left">
                <SortHeader
                  field="stock"
                  currentField={sortBy}
                  order={sortOrder}
                  onSort={onSort}
                >
                  Запас
                </SortHeader>
              </th>
              <th className="py-2.5 px-3 text-left hidden lg:table-cell">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Мін/Макс
                </span>
              </th>
              <th className="py-2.5 px-3 text-left hidden sm:table-cell">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Свіжість
                </span>
              </th>
              <th className="py-2.5 px-3 text-left hidden lg:table-cell">
                <SortHeader
                  field="status"
                  currentField={sortBy}
                  order={sortOrder}
                  onSort={onSort}
                >
                  Статус
                </SortHeader>
              </th>
              <th className="py-2.5 px-3 text-right hidden xl:table-cell">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ціна
                </span>
              </th>
              <th className="py-2.5 px-3 text-right hidden xl:table-cell">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Сума
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductTableRow
                key={product.documentId}
                product={product}
                onSelect={() => onSelect(product)}
                selected={selectedId === product.documentId}
              />
            ))}
          </tbody>
          {/* Footer with totals */}
          <tfoot className="bg-muted/30 border-t">
            <tr>
              <td colSpan={4} className="py-2.5 px-3">
                <span className="text-sm font-medium">
                  Всього: {products.length} позицій
                </span>
              </td>
              <td className="py-2.5 px-3 hidden lg:table-cell" />
              <td className="py-2.5 px-3 hidden sm:table-cell" />
              <td className="py-2.5 px-3 hidden lg:table-cell" />
              <td className="py-2.5 px-3 hidden xl:table-cell" />
              <td className="py-2.5 px-3 text-right hidden xl:table-cell">
                <span className="text-sm font-semibold tabular-nums">
                  {totalValue.toFixed(0)} ₴
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Немає продуктів для відображення
        </div>
      )}
    </div>
  );
}
