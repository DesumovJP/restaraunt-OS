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
import { CategoryFilterMinimal } from "@/features/storage/components/category-filter-minimal";
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
        case "status":
          const getStatusPriority = (p: ExtendedProduct) => {
            if ((p.currentStock || 0) === 0) return 0;
            if ((p.currentStock || 0) <= (p.minStock || 0)) return 1;
            return 2;
          };
          comparison = getStatusPriority(a) - getStatusPriority(b);
          break;
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b safe-top">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Smart Storage</h1>
            {totalAlerts > 0 && !alertsDismissed && (
              <AlertIndicator
                count={totalAlerts}
                critical={lowStockProducts.some((p) => p.currentStock === 0)}
                onClick={() => setSortBy("status")}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "inventory" && (
              <ViewToggle value={viewMode} onChange={setViewMode} />
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsScannerOpen(true)}
              aria-label="Сканувати QR-код"
            >
              <QrCode className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              aria-label="Прийняти поставку"
              onClick={() => setIsSupplyFormOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          <button
            onClick={() => setActiveTab("inventory")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              activeTab === "inventory"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Layers className="h-4 w-4" />
            Інвентар
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
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              activeTab === "batches"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Archive className="h-4 w-4" />
            Партії / Історія
            {todaysBatchesCount > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-xs">
                +{todaysBatchesCount}
              </Badge>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4">
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

            {/* Toolbar: Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
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
              <CategoryFilterMinimal
                selectedMainCategory={selectedMainCategory}
                selectedSubCategory={selectedSubCategory}
                onMainCategoryChange={setSelectedMainCategory}
                onSubCategoryChange={setSelectedSubCategory}
                categoryCounts={categoryCounts}
              />
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
          <div className="text-center text-muted-foreground py-8">
            Партії та історія - в розробці
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
