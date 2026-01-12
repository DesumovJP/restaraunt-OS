"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { QRScanner } from "@/features/inventory/qr-scanner";

// New optimized components
import {
  ViewToggle,
  AlertBanner,
  AlertIndicator,
  ProductPreview,
  SupplyForm,
  WriteOffForm,
} from "@/features/storage/components";
import { ProductList, ProductListSkeleton } from "@/features/storage/views";
import { MOCK_BATCHES } from "@/features/storage";

// Stores
import { useStorageUIStore } from "@/stores/storage-ui-store";
import { useStorageProducts } from "@/hooks/use-storage";
import { getCategoryCounts, filterProductsByCategory } from "@/lib/mock-storage-data";

// Icons
import {
  QrCode,
  Plus,
  Search,
  Layers,
  Archive,
  ArrowUpDown,
  Package,
} from "lucide-react";

// Types
import type { ExtendedProduct, StorageMainCategory, StorageSubCategory } from "@/types/extended";

type StorageTab = "inventory" | "batches";

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function StoragePage() {
  // Tab state
  const [activeTab, setActiveTab] = React.useState<StorageTab>("inventory");

  // UI state from store
  const viewMode = useStorageUIStore((s) => s.viewMode);
  const setViewMode = useStorageUIStore((s) => s.setViewMode);
  const sortBy = useStorageUIStore((s) => s.sortBy);
  const sortOrder = useStorageUIStore((s) => s.sortOrder);
  const setSortBy = useStorageUIStore((s) => s.setSortBy);
  const previewProductId = useStorageUIStore((s) => s.previewProductId);
  const openPreview = useStorageUIStore((s) => s.openPreview);
  const closePreview = useStorageUIStore((s) => s.closePreview);
  const alertsDismissed = useStorageUIStore((s) => s.alertsDismissed);
  const dismissAlerts = useStorageUIStore((s) => s.dismissAlerts);

  // Local state
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isSupplyFormOpen, setIsSupplyFormOpen] = React.useState(false);
  const [isWriteOffFormOpen, setIsWriteOffFormOpen] = React.useState(false);
  const [writeOffBatch, setWriteOffBatch] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMainCategory, setSelectedMainCategory] = React.useState<StorageMainCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = React.useState<StorageSubCategory | null>(null);

  // Fetch products
  const { products, isLoading, error } = useStorageProducts();

  // Calculate category counts
  const categoryCounts = React.useMemo(() => getCategoryCounts(products), [products]);

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let result = filterProductsByCategory(
      products,
      selectedMainCategory || undefined,
      selectedSubCategory || undefined
    );

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(query) ||
          (p.sku || "").toLowerCase().includes(query) ||
          (p.category || "").toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "stock":
          comparison = (a.currentStock || 0) - (b.currentStock || 0);
          break;
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "");
          break;
        case "updated":
          comparison = new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
          break;
        case "status": {
          const getStatusPriority = (p: ExtendedProduct) => {
            if ((p.currentStock || 0) === 0) return 0;
            if ((p.currentStock || 0) <= (p.minStock || 0)) return 1;
            return 2;
          };
          comparison = getStatusPriority(a) - getStatusPriority(b);
          break;
        }
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [products, selectedMainCategory, selectedSubCategory, searchQuery, sortBy, sortOrder]);

  // Alert data
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
    return MOCK_BATCHES.filter((b) => new Date(b.receivedAt) >= todayStart).length;
  }, []);

  // Selected product for preview
  const selectedProduct = React.useMemo(
    () => products.find((p) => p.documentId === previewProductId) || null,
    [products, previewProductId]
  );

  // Handle close shift
  const handleCloseShift = React.useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaysBatches = MOCK_BATCHES.filter(
      (b) => new Date(b.receivedAt) >= todayStart
    );

    const csvContent = [
      ["Продукт", "Партія", "Накладна", "Вага (кг)", "Ціна за кг", "Загальна сума", "Статус", "Термін"].join(","),
      ...todaysBatches.map((b) =>
        [
          b.productName,
          b.batchNumber,
          b.invoiceNumber,
          b.grossIn,
          b.unitCost,
          b.totalCost,
          b.status,
          b.expiryDate ? new Date(b.expiryDate).toLocaleDateString("uk-UA") : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `поставки_${new Date().toLocaleDateString("uk-UA").replace(/\./g, "-")}.csv`;
    link.click();
  }, []);

  // Handle QR scan
  const handleQRScan = (data: { sku?: string }) => {
    if (data.sku) {
      setSearchQuery(data.sku);
    }
  };

  // Handle product select
  const handleProductSelect = (product: ExtendedProduct) => {
    openPreview(product.documentId);
  };

  return (
    <div className="flex flex-col h-screen-safe bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm safe-area-inset-top">
        {/* Top row */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-xl font-bold">Smart Storage</h1>
            {totalAlerts > 0 && !alertsDismissed && (
              <AlertIndicator
                count={totalAlerts}
                critical={lowStockProducts.some((p) => p.currentStock === 0)}
                onClick={() => setSortBy("status")}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeTab === "inventory" && (
              <ViewToggle value={viewMode} onChange={setViewMode} />
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsScannerOpen(true)}
              aria-label="Сканувати QR-код"
              className="h-10 w-10 sm:h-9 sm:w-9 rounded-xl touch-feedback"
            >
              <QrCode className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              aria-label="Прийняти поставку"
              onClick={() => setIsSupplyFormOpen(true)}
              className="h-10 w-10 sm:h-9 sm:w-9 rounded-xl touch-feedback"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs - touch-friendly */}
        <div className="flex gap-1.5 px-3 sm:px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("inventory")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-xl transition-all touch-feedback",
              activeTab === "inventory"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Layers className="h-4 w-4" />
            <span className="whitespace-nowrap">Інвентар</span>
            <Badge
              variant={activeTab === "inventory" ? "secondary" : "outline"}
              className="h-5 px-1.5 text-xs"
            >
              {products.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-xl transition-all touch-feedback",
              activeTab === "batches"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Archive className="h-4 w-4" />
            <span className="whitespace-nowrap">Партії / Історія</span>
            {todaysBatchesCount > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-xs">
                +{todaysBatchesCount}
              </Badge>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 scroll-container">
        {activeTab === "inventory" && (
          <div className="space-y-4">
            {/* Alert banner */}
            {!alertsDismissed && (
              <AlertBanner
                alerts={[
                  {
                    type: "low_stock",
                    count: lowStockProducts.length,
                    items: lowStockProducts.slice(0, 3).map((p) => ({
                      id: p.documentId,
                      name: p.name,
                    })),
                  },
                  {
                    type: "expiring",
                    count: expiringProducts.length,
                    items: expiringProducts.slice(0, 3).map((p) => ({
                      id: p.documentId,
                      name: p.name,
                    })),
                  },
                ]}
                collapsible
                onViewAll={() => setSortBy("status")}
                onDismiss={dismissAlerts}
              />
            )}

            {/* Toolbar: Search (compact) */}
            <div className="flex items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Пошук..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-sm"
                  aria-label="Пошук товарів"
                />
              </div>
            </div>

            {/* Category chips - horizontal scrollable */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <button
                onClick={() => {
                  setSelectedMainCategory(null);
                  setSelectedSubCategory(null);
                }}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  !selectedMainCategory
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Всі
                <span className="ml-1.5 text-xs opacity-70">{products.length}</span>
              </button>
              {Object.entries(categoryCounts?.main || {}).map(([category, count]) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedMainCategory(category as StorageMainCategory);
                    setSelectedSubCategory(null);
                  }}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    selectedMainCategory === category
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {category === "raw" && "Сировина"}
                  {category === "prep" && "Заготовки"}
                  {category === "dry" && "Бакалія"}
                  {category === "seasonings" && "Приправи"}
                  {category === "oils" && "Олії"}
                  {category === "dairy" && "Молочні"}
                  {category === "beverages" && "Напої"}
                  {category === "frozen" && "Заморожені"}
                  {category === "ready" && "Готові"}
                  <span className="ml-1.5 text-xs opacity-70">{count}</span>
                </button>
              ))}
            </div>

            {/* Results info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {filteredProducts.length === products.length
                  ? `${products.length} товарів`
                  : `${filteredProducts.length} з ${products.length} товарів`}
              </span>
              <div className="flex items-center gap-2">
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
                    Скинути
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortBy(sortBy)}
                  className="gap-1"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Сортування
                </Button>
              </div>
            </div>

            {/* Product list */}
            {isLoading ? (
              <ProductListSkeleton viewMode={viewMode} />
            ) : error ? (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive font-medium">Помилка завантаження</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                type={searchQuery ? "search" : "inventory"}
                title={searchQuery ? "Нічого не знайдено" : "Склад порожній"}
              />
            ) : (
              <ProductList
                products={filteredProducts}
                viewMode={viewMode}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={setSortBy}
                onSelect={handleProductSelect}
                selectedId={previewProductId || undefined}
              />
            )}
          </div>
        )}

        {activeTab === "batches" && (
          <div className="space-y-6 max-w-5xl">
            {/* Development Banner */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Archive className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900">Розділ у розробці</p>
                <p className="text-sm text-amber-700">
                  Повний функціонал обліку партій буде доступний найближчим часом
                </p>
              </div>
            </div>

            {/* Today's deliveries */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>Сьогоднішні поставки</span>
                <Badge variant="secondary" className="text-xs">{todaysBatchesCount}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {MOCK_BATCHES
                  .filter((b) => {
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    return new Date(b.receivedAt) >= todayStart;
                  })
                  .map((batch) => (
                    <div
                      key={batch.documentId}
                      className="flex items-start gap-3 p-4 bg-white border rounded-xl hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{batch.productName}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                          <span>#{batch.batchNumber}</span>
                          <span className="text-slate-300">•</span>
                          <span>{batch.invoiceNumber}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">
                            {batch.grossIn} кг
                          </span>
                          <span className="text-sm text-slate-600 tabular-nums">
                            {batch.totalCost.toLocaleString()} ₴
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Previous deliveries */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Попередні партії</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {MOCK_BATCHES
                  .filter((b) => {
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    return new Date(b.receivedAt) < todayStart;
                  })
                  .map((batch) => (
                    <div
                      key={batch.documentId}
                      className="flex items-start gap-3 p-4 bg-white border rounded-xl hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Package className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{batch.productName}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                          <span>#{batch.batchNumber}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                            batch.status === "in_use"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          )}>
                            {batch.status === "in_use" ? "В роботі" : "Доступно"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">
                            {batch.netAvailable} кг
                          </span>
                          <span className="text-xs text-slate-400">
                            з {batch.grossIn} кг
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Close shift button */}
            <Button
              variant="outline"
              onClick={handleCloseShift}
              className="w-full max-w-xs h-11 rounded-xl"
            >
              Експортувати звіт за зміну
            </Button>
          </div>
        )}
      </main>

      {/* Product Preview Drawer */}
      <ProductPreview
        product={selectedProduct}
        open={!!previewProductId}
        onClose={closePreview}
        onEdit={(p) => console.log("Edit", p)}
        onUse={(p) => console.log("Use", p)}
        onWriteOff={(p) => {
          // Find a batch for this product to write off
          const batch = MOCK_BATCHES.find(
            (b) => b.productId === p.documentId && b.netAvailable > 0
          );
          if (batch) {
            setWriteOffBatch({
              documentId: batch.documentId,
              batchNumber: batch.batchNumber,
              netAvailable: batch.netAvailable,
              wastedAmount: batch.wastedAmount,
              unitCost: batch.unitCost,
              expiryDate: batch.expiryDate,
              ingredient: {
                documentId: p.documentId,
                name: p.name,
                unit: p.unit,
              },
            });
            setIsWriteOffFormOpen(true);
            closePreview();
          }
        }}
      />

      {/* QR Scanner */}
      <QRScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleQRScan}
      />

      {/* Supply Form */}
      <SupplyForm
        open={isSupplyFormOpen}
        onOpenChange={setIsSupplyFormOpen}
        onSuccess={() => {
          // Refetch products after supply
          console.log("Supply created successfully");
        }}
      />

      {/* Write-off Form */}
      <WriteOffForm
        batch={writeOffBatch}
        open={isWriteOffFormOpen}
        onOpenChange={setIsWriteOffFormOpen}
        onSuccess={() => {
          setWriteOffBatch(null);
          console.log("Write-off completed successfully");
        }}
      />
    </div>
  );
}
