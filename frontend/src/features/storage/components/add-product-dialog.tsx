"use client";

import * as React from "react";
import { useQuery } from "urql";
import { GET_ALL_INGREDIENTS } from "@/graphql/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryOrderItem, DeliveryIngredient } from "@/types/delivery";
import type { StorageMainCategory, ProductUnit } from "@/types/storage";
import { STORAGE_MAIN_CATEGORY_LABELS } from "@/types/storage";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: DeliveryOrderItem) => void;
  existingIds: string[];
}

const UNIT_LABELS: Record<string, string> = {
  kg: "кг",
  g: "г",
  l: "л",
  ml: "мл",
  pcs: "шт",
  portion: "порц",
};

function generateUUID(): string {
  return crypto.randomUUID();
}

export function AddProductDialog({
  open,
  onOpenChange,
  onAdd,
  existingIds,
}: AddProductDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<StorageMainCategory | "all">("all");
  const [selectedIngredient, setSelectedIngredient] = React.useState<DeliveryIngredient | null>(null);
  const [quantity, setQuantity] = React.useState("");

  const [result] = useQuery({
    query: GET_ALL_INGREDIENTS,
    pause: !open,
  });

  const { data, fetching } = result;
  const ingredients: DeliveryIngredient[] = data?.ingredients || [];

  // Get available categories from ingredients
  const availableCategories = React.useMemo(() => {
    const categories = new Set<StorageMainCategory>();
    ingredients.forEach((ing) => {
      if (ing.mainCategory) {
        categories.add(ing.mainCategory as StorageMainCategory);
      }
    });
    return Array.from(categories).sort();
  }, [ingredients]);

  // Filter ingredients based on search, category and exclude already added
  const filteredIngredients = React.useMemo(() => {
    return ingredients.filter((ing) => {
      // Exclude already added
      if (existingIds.includes(ing.documentId)) return false;

      // Category filter
      if (categoryFilter !== "all" && ing.mainCategory !== categoryFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          ing.name.toLowerCase().includes(query) ||
          (ing.nameUk && ing.nameUk.toLowerCase().includes(query)) ||
          (ing.sku && ing.sku.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [ingredients, searchQuery, categoryFilter, existingIds]);

  // Reset form on close
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setCategoryFilter("all");
      setSelectedIngredient(null);
      setQuantity("");
    }
  }, [open]);

  const handleAdd = () => {
    if (!selectedIngredient || !quantity) return;

    const qty = parseFloat(quantity) || 0;

    const item: DeliveryOrderItem = {
      id: generateUUID(),
      ingredientId: selectedIngredient.documentId,
      isNew: false,
      name: selectedIngredient.name,
      nameUk: selectedIngredient.nameUk,
      sku: selectedIngredient.sku,
      unit: selectedIngredient.unit,
      quantity: qty,
      unitCost: 0,
      totalCost: 0,
      mainCategory: selectedIngredient.mainCategory,
    };

    onAdd(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-slate-50/50">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="block">Додати товар</span>
              <span className="text-xs font-normal text-muted-foreground">
                Оберіть існуючий продукт зі списку
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col overflow-hidden">
          {/* Search & Category Filter */}
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за назвою або SKU..."
                className="pl-10 h-10"
                autoFocus
              />
            </div>

            {/* Category Filter Tabs */}
            {availableCategories.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    categoryFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Всі
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      categoryFilter === cat
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {STORAGE_MAIN_CATEGORY_LABELS[cat]?.uk || cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ingredient List */}
          <div className="flex-1 max-h-[300px] overflow-y-auto">
            {fetching ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredIngredients.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">Товари не знайдено</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Спробуйте змінити пошуковий запит
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredIngredients.map((ingredient) => (
                  <button
                    key={ingredient.documentId}
                    onClick={() => setSelectedIngredient(ingredient)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors",
                      selectedIngredient?.documentId === ingredient.documentId && "bg-blue-50 hover:bg-blue-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      selectedIngredient?.documentId === ingredient.documentId
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100"
                    )}>
                      {selectedIngredient?.documentId === ingredient.documentId ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Package className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {ingredient.nameUk || ingredient.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {ingredient.sku && <span>{ingredient.sku}</span>}
                        <span className="text-slate-300">|</span>
                        <span>{UNIT_LABELS[ingredient.unit] || ingredient.unit}</span>
                        {ingredient.mainCategory && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span>
                              {STORAGE_MAIN_CATEGORY_LABELS[ingredient.mainCategory as StorageMainCategory]?.uk || ingredient.mainCategory}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {ingredient.currentStock.toLocaleString("uk-UA")} {UNIT_LABELS[ingredient.unit] || ingredient.unit}
                      </p>
                      {ingredient.costPerUnit && (
                        <p className="text-xs text-muted-foreground">
                          {ingredient.costPerUnit.toLocaleString("uk-UA")} грн/{UNIT_LABELS[ingredient.unit] || ingredient.unit}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Product Form */}
          {selectedIngredient && (
            <div className="p-4 border-t bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="font-medium flex-1">
                  {selectedIngredient.nameUk || selectedIngredient.name}
                </span>
                <Badge variant="secondary">
                  {UNIT_LABELS[selectedIngredient.unit] || selectedIngredient.unit}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm">
                  Кількість <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="pr-12 h-11"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {UNIT_LABELS[selectedIngredient.unit] || selectedIngredient.unit}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl"
          >
            Скасувати
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedIngredient || !quantity}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Додати
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
