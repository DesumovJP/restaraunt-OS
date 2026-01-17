"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRScanner } from "@/features/inventory/qr-scanner";

// Sidebar
import { StorageLeftSidebar, type StorageView } from "@/features/storage/storage-left-sidebar";
import { WorkerProfileCard } from "@/features/profile/worker-profile-card";
import { WorkersChat } from "@/features/admin/workers-chat";
import { DailiesView } from "@/features/dailies";
import { ShiftScheduleView } from "@/features/schedule";
import { useAuthStore } from "@/stores/auth-store";

// New optimized components
import {
  ViewToggle,
  AlertBanner,
  AlertIndicator,
  ProductPreview,
  SupplyForm,
  WriteOffForm,
  CategoryFilterMinimal,
} from "@/features/storage/components";
import { ProductList, ProductListSkeleton, BatchView } from "@/features/storage/views";
import { MOCK_BATCHES } from "@/features/storage";
import { useBatchMutations, useStorageAlerts } from "@/hooks/use-batches";
import { useBatchesData } from "@/hooks/use-batches-data";
import { useStorageNotifications } from "@/hooks/use-storage-notifications";

// Stores
import { useStorageUIStore } from "@/stores/storage-ui-store";
import { useStorageProducts } from "@/hooks/use-storage";
import { getCategoryCounts, filterProductsByCategory } from "@/lib/mock-storage-data";

// Icons
import {
  Menu,
  QrCode,
  Plus,
  Search,
  ArrowUpDown,
  Package,
  Archive,
} from "lucide-react";

// Types
import type { ExtendedProduct, StorageMainCategory, StorageSubCategory } from "@/types/extended";

// ==========================================
// BATCH VIEW WRAPPER (with API integration)
// ==========================================

interface BatchViewWrapperProps {
  onExportReport: () => void;
}

function BatchViewWrapper({ onExportReport }: BatchViewWrapperProps) {
  const { batches, isLoading, error, refetch } = useBatchesData();
  const mutations = useBatchMutations();

  const handleProcess = async (
    batch: any,
    processType: any,
    yieldRatio: number,
    notes?: string
  ) => {
    try {
      await mutations.processBatch(batch.documentId, processType, yieldRatio, notes);
      refetch();
    } catch (err) {
      console.error("Process error:", err);
      throw err;
    }
  };

  const handleWriteOff = async (
    batch: any,
    reason: string,
    quantity: number,
    notes?: string
  ) => {
    try {
      await mutations.writeOffBatch(batch.documentId, reason, quantity, notes);
      refetch();
    } catch (err) {
      console.error("Write-off error:", err);
      throw err;
    }
  };

  const handleCount = async (batch: any, actualQuantity: number, notes?: string) => {
    try {
      await mutations.countBatch(batch.documentId, actualQuantity, notes);
      refetch();
    } catch (err) {
      console.error("Count error:", err);
      throw err;
    }
  };

  const handleLock = async (batch: any) => {
    try {
      await mutations.lockBatch(batch.documentId);
      refetch();
    } catch (err) {
      console.error("Lock error:", err);
    }
  };

  const handleUnlock = async (batch: any) => {
    try {
      await mutations.unlockBatch(batch.documentId);
      refetch();
    } catch (err) {
      console.error("Unlock error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <BatchView
        batches={batches}
        isLoading={isLoading}
        error={error}
        onProcess={handleProcess}
        onWriteOff={handleWriteOff}
        onCount={handleCount}
        onLock={handleLock}
        onUnlock={handleUnlock}
        onRefresh={refetch}
      />
      <Button
        variant="outline"
        onClick={onExportReport}
        className="w-full max-w-xs h-11 rounded-xl"
      >
        Експортувати звіт за зміну
      </Button>
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function StoragePage() {
  // View state (controlled by sidebar)
  const [activeView, setActiveView] = React.useState<StorageView>("inventory");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Track visited views for lazy mounting (only load when first visited)
  const [visitedViews, setVisitedViews] = React.useState<Set<StorageView>>(
    () => new Set(["inventory"])
  );

  // Update visited views when switching
  const handleViewChange = React.useCallback((view: StorageView) => {
    setActiveView(view);
    setVisitedViews(prev => {
      if (prev.has(view)) return prev;
      return new Set([...prev, view]);
    });
  }, []);

  // Storage notifications (auto-checks and shows toasts for alerts)
  useStorageNotifications();

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
  const { products, isLoading, error, refetch: refetchProducts } = useStorageProducts();

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
        case "freshness": {
          // Sort by days until expiry (closest expiring first)
          const getDaysUntilExpiry = (p: ExtendedProduct) => {
            if (!p.expiryDate) return 999999; // No expiry = last
            const now = new Date();
            const expiry = new Date(p.expiryDate);
            return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          };
          comparison = getDaysUntilExpiry(a) - getDaysUntilExpiry(b);
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
    <div className="flex h-screen-safe bg-background overflow-hidden">
      {/* Sidebar */}
      <StorageLeftSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm safe-area-inset-top">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 rounded-xl touch-feedback"
                onClick={() => setSidebarOpen(true)}
                aria-label="Відкрити меню"
              >
                <Menu className="h-5 w-5" />
              </Button>
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
              {activeView === "inventory" && (
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
        </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 scroll-container">
        {activeView === "inventory" && (
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

            {/* Toolbar: Search + Category filter in one row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-1 sm:max-w-[200px]">
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
              <CategoryFilterMinimal
                selectedMainCategory={selectedMainCategory}
                selectedSubCategory={selectedSubCategory}
                onMainCategoryChange={setSelectedMainCategory}
                onSubCategoryChange={setSelectedSubCategory}
                categoryCounts={categoryCounts}
              />
            </div>

            {/* Results info + Sorting */}
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
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs rounded-xl">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">За назвою</SelectItem>
                    <SelectItem value="stock">За кількістю</SelectItem>
                    <SelectItem value="freshness">За свіжістю</SelectItem>
                    <SelectItem value="status">За статусом</SelectItem>
                    <SelectItem value="updated">За оновленням</SelectItem>
                    <SelectItem value="category">За категорією</SelectItem>
                  </SelectContent>
                </Select>
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

        {activeView === "batches" && (
          <BatchViewWrapper onExportReport={handleCloseShift} />
        )}

        {/* Dailies View - lazy mount, then keep mounted */}
        {visitedViews.has("dailies") && (
          <div className={cn("h-full", activeView !== "dailies" && "hidden")}>
            <DailiesView compact className="h-full" variant="storage" onOpenSidebar={() => setSidebarOpen(true)} />
          </div>
        )}

        {/* Chat View - lazy mount, then keep mounted */}
        {visitedViews.has("chat") && (
          <div className={cn("h-full", activeView !== "chat" && "hidden")}>
            <WorkersChat />
          </div>
        )}

        {/* Schedule View - lazy mount, then keep mounted */}
        {visitedViews.has("schedule") && (
          <div className={cn("h-full", activeView !== "schedule" && "hidden")}>
            <ShiftScheduleView compact className="h-full" />
          </div>
        )}

        {/* Profile View */}
        {activeView === "profile" && (
          <div className="max-w-md mx-auto">
            <WorkerProfileCard
              worker={{
                documentId: 'storage-1',
                name: 'Комірник',
                role: 'waiter',
                department: 'service',
                status: 'active',
                hoursThisWeek: 40,
                hoursThisMonth: 160,
                shiftsThisWeek: 5,
                shiftsThisMonth: 20,
              }}
              variant="full"
              onLogout={() => {
                useAuthStore.getState().logout();
                window.location.href = '/';
              }}
            />
          </div>
        )}
      </main>
      </div>

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
          refetchProducts();
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
