"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { QRScanner } from "@/features/inventory/qr-scanner";
import { CategoryFilter } from "@/features/storage/category-filter";
import { BatchesList, MOCK_BATCHES } from "@/features/storage/batches-list";
import { cn, formatRelativeTime } from "@/lib/utils";
import { MOCK_PRODUCTS, getCategoryCounts, filterProductsByCategory } from "@/lib/mock-storage-data";
import {
  Package,
  QrCode,
  Plus,
  AlertTriangle,
  Search,
  Clock,
  Thermometer,
  TrendingDown,
  Layers,
  Archive,
} from "lucide-react";
import type { ExtendedProduct, StorageMainCategory, StorageSubCategory } from "@/types/extended";
import { STORAGE_CONDITION_LABELS, STORAGE_SUB_CATEGORY_LABELS } from "@/types/extended";

type StorageTab = "inventory" | "batches";

export default function StoragePage() {
  // Tab state
  const [activeTab, setActiveTab] = React.useState<StorageTab>("inventory");

  // State
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Category filters
  const [selectedMainCategory, setSelectedMainCategory] = React.useState<StorageMainCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = React.useState<StorageSubCategory | null>(null);

  // Use mock products
  const products = MOCK_PRODUCTS;

  // Calculate category counts
  const categoryCounts = React.useMemo(() => getCategoryCounts(products), [products]);

  // Filter products
  const filteredProducts = React.useMemo(() => {
    let result = filterProductsByCategory(products, selectedMainCategory || undefined, selectedSubCategory || undefined);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [products, selectedMainCategory, selectedSubCategory, searchQuery]);

  // Get alert counts
  const lowStockProducts = React.useMemo(
    () => products.filter((p) => p.currentStock <= p.minStock),
    [products]
  );
  const expiringProducts = React.useMemo(() => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return products.filter(
      (p) => p.expiryDate && new Date(p.expiryDate) <= sevenDaysFromNow
    );
  }, [products]);

  const totalAlerts = lowStockProducts.length + expiringProducts.length;

  // Today's batches count
  const todaysBatchesCount = React.useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return MOCK_BATCHES.filter(b => new Date(b.receivedAt) >= todayStart).length;
  }, []);

  // Handle close shift
  const handleCloseShift = React.useCallback(() => {
    // Generate CSV export of today's batches
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaysBatches = MOCK_BATCHES.filter(b => new Date(b.receivedAt) >= todayStart);

    const csvContent = [
      ['Продукт', 'Партія', 'Накладна', 'Вага (кг)', 'Ціна за кг', 'Загальна сума', 'Статус', 'Термін'].join(','),
      ...todaysBatches.map(b => [
        b.productName,
        b.batchNumber,
        b.invoiceNumber,
        b.grossIn,
        b.unitCost,
        b.totalCost,
        b.status,
        b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('uk-UA') : ''
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `поставки_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '-')}.csv`;
    link.click();
  }, []);

  // Handle QR scan result
  const handleQRScan = (data: {
    sku?: string;
    name?: string;
    quantity?: number;
    expiryDate?: Date;
    batchNumber?: string;
  }) => {
    if (data.sku) {
      setSearchQuery(data.sku);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Smart Storage</h1>
            {totalAlerts > 0 && (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {totalAlerts}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsScannerOpen(true)}
              aria-label="Сканувати QR-код"
            >
              <QrCode className="h-5 w-5" />
            </Button>
            <Button size="icon" aria-label="Додати товар">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab("inventory")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === "inventory"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            Інвентар
            <Badge variant="outline" className="h-5 px-1.5 text-xs">
              {products.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === "batches"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Archive className="h-4 w-4" />
            Партії
            {todaysBatchesCount > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-xs">
                +{todaysBatchesCount}
              </Badge>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "inventory" ? (
          <>
            {/* Alert banner */}
            {(lowStockProducts.length > 0 || expiringProducts.length > 0) && (
              <div className="p-3 bg-warning-light border border-warning/30 rounded-lg">
                <div className="flex items-center gap-2 text-warning font-medium mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Потрібна увага
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {lowStockProducts.length > 0 && (
                    <li>{lowStockProducts.length} товарів з низьким запасом</li>
                  )}
                  {expiringProducts.length > 0 && (
                    <li>{expiringProducts.length} товарів з терміном, що закінчується</li>
                  )}
                </ul>
              </div>
            )}

            {/* Category filter */}
            <CategoryFilter
              selectedMainCategory={selectedMainCategory}
              selectedSubCategory={selectedSubCategory}
              onMainCategoryChange={setSelectedMainCategory}
              onSubCategoryChange={setSelectedSubCategory}
              categoryCounts={categoryCounts}
            />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Пошук по назві або SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Пошук товарів"
              />
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Знайдено: {filteredProducts.length} з {products.length} товарів
              </span>
              {(selectedMainCategory || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMainCategory(null);
                    setSelectedSubCategory(null);
                    setSearchQuery("");
                  }}
                >
                  Скинути фільтри
                </Button>
              )}
            </div>

            {/* Products grid */}
            {filteredProducts.length === 0 ? (
              <EmptyState
                type={searchQuery ? "search" : "inventory"}
                title={searchQuery ? "Нічого не знайдено" : "Склад порожній"}
              />
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.documentId} product={product} />
                ))}
              </div>
            )}
          </>
        ) : (
          <BatchesList onCloseShift={handleCloseShift} />
        )}
      </main>

      {/* QR Scanner dialog */}
      <QRScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleQRScan}
      />
    </div>
  );
}

// ==========================================
// PRODUCT CARD COMPONENT
// ==========================================

interface ProductCardProps {
  product: ExtendedProduct;
  onSelect?: (product: ExtendedProduct) => void;
}

function ProductCard({ product, onSelect }: ProductCardProps) {
  const stockPercentage = Math.min(
    (product.currentStock / product.maxStock) * 100,
    100
  );
  const isLowStock = product.currentStock <= product.minStock;
  const isExpiring =
    product.expiryDate &&
    new Date(product.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const storageCondition = STORAGE_CONDITION_LABELS[product.storageCondition];
  const subCategoryLabel = STORAGE_SUB_CATEGORY_LABELS[product.subCategory];

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
        <div className="flex items-start gap-3">
          {/* Product icon/image */}
          <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  {isLowStock && (
                    <Badge variant="warning" className="shrink-0 h-5 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Мало
                    </Badge>
                  )}
                  {isExpiring && (
                    <Badge variant="destructive" className="shrink-0 h-5 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Термін
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {product.sku} | {subCategoryLabel.uk}
                </p>
              </div>

              {/* Stock display */}
              <div className="text-right shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{product.currentStock}</span>
                  <span className="text-sm text-muted-foreground">{product.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {product.minStock} - {product.maxStock}
                </p>
              </div>
            </div>

            {/* Stock progress */}
            <Progress
              value={stockPercentage}
              className="h-1.5"
              indicatorClassName={cn(
                stockPercentage <= 20
                  ? "bg-danger"
                  : stockPercentage <= 40
                    ? "bg-warning"
                    : "bg-success"
              )}
            />

            {/* Meta info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {/* Storage condition */}
              <span className="flex items-center gap-1">
                <Thermometer className="h-3 w-3" />
                {storageCondition.uk} ({storageCondition.tempRange})
              </span>

              {/* Expected yield - only for raw ingredients */}
              {product.mainCategory === 'raw' && product.yieldProfile && (
                <span className="flex items-center gap-1 text-amber-600">
                  <TrendingDown className="h-3 w-3" />
                  Вихід: {Math.round(product.yieldProfile.baseYieldRatio * 100)}%
                </span>
              )}
            </div>

            {/* Cost & update info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
              <span>
                {product.costPerUnit.toFixed(2)} грн/{product.unit}
              </span>
              <span>
                Оновлено: {formatRelativeTime(new Date(product.lastUpdated))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
