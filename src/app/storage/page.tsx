"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InventoryTable } from "@/features/inventory/inventory-table";
import { QRScanner } from "@/features/inventory/qr-scanner";
import { RecipeCard } from "@/features/recipes/recipe-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useInventoryStore } from "@/stores/inventory-store";
import { inventoryApi, recipesApi } from "@/lib/api";
import {
  Package,
  QrCode,
  ChefHat,
  Plus,
  AlertTriangle,
} from "lucide-react";
import type { Product, Recipe } from "@/types";

export default function StoragePage() {
  const {
    products,
    searchQuery,
    setProducts,
    setSearchQuery,
    getLowStockProducts,
    getExpiringProducts,
  } = useInventoryStore();

  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("inventory");

  // Load data
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, recipesRes] = await Promise.all([
          inventoryApi.getProducts(),
          recipesApi.getRecipes(),
        ]);
        if (productsRes.success) setProducts(productsRes.data);
        if (recipesRes.success) setRecipes(recipesRes.data);
      } catch (error) {
        console.error("Failed to load storage data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setProducts]);

  // Get alert counts
  const lowStockCount = getLowStockProducts().length;
  const expiringCount = getExpiringProducts(7).length;
  const totalAlerts = lowStockCount + expiringCount;

  // Handle QR scan result
  const handleQRScan = (data: {
    sku?: string;
    name?: string;
    quantity?: number;
    expiryDate?: Date;
    batchNumber?: string;
  }) => {
    // TODO: Open supply creation dialog with pre-filled data
    console.log("Scanned data:", data);
    // For now, just search for the product
    if (data.sku) {
      setSearchQuery(data.sku);
      setActiveTab("inventory");
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="inventory" className="flex-1 gap-2">
              <Package className="h-4 w-4" />
              Інвентар
              {lowStockCount > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5">
                  {lowStockCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex-1 gap-2">
              <ChefHat className="h-4 w-4" />
              Рецепти
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Inventory tab */}
          <TabsContent value="inventory" className="mt-0">
            {/* Alert banner */}
            {(lowStockCount > 0 || expiringCount > 0) && (
              <div className="mb-4 p-3 bg-warning-light border border-warning/30 rounded-lg">
                <div className="flex items-center gap-2 text-warning font-medium mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Потрібна увага
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {lowStockCount > 0 && (
                    <li>{lowStockCount} товарів з низьким запасом</li>
                  )}
                  {expiringCount > 0 && (
                    <li>{expiringCount} товарів з терміном, що закінчується</li>
                  )}
                </ul>
              </div>
            )}

            <InventoryTable
              products={products}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </TabsContent>

          {/* Recipes tab */}
          <TabsContent value="recipes" className="mt-0">
            {recipes.length === 0 ? (
              <EmptyState
                type="menu"
                title="Немає рецептів"
                description="Рецепти з'являться тут після налаштування"
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
