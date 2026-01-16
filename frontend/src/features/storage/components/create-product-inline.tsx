"use client";

import * as React from "react";
import { useMutation } from "urql";
import { CREATE_INGREDIENT } from "@/graphql/mutations";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, Plus } from "lucide-react";
import type { DeliveryOrderItem } from "@/types/delivery";
import type { StorageMainCategory, ProductUnit, StorageSubCategory } from "@/types/storage";
import {
  STORAGE_MAIN_CATEGORY_LABELS,
  STORAGE_SUB_CATEGORY_LABELS,
} from "@/types/storage";

interface CreateProductInlineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (item: DeliveryOrderItem) => void;
}

const UNITS: { value: ProductUnit; label: string }[] = [
  { value: "kg", label: "кг" },
  { value: "g", label: "г" },
  { value: "l", label: "л" },
  { value: "ml", label: "мл" },
  { value: "pcs", label: "шт" },
  { value: "portion", label: "порц" },
];

const STORAGE_CONDITIONS = [
  { value: "ambient", label: "Кімнатна" },
  { value: "refrigerated", label: "Холодильник" },
  { value: "frozen", label: "Морозильник" },
  { value: "dry-cool", label: "Сухе прохолодне" },
];

function generateUUID(): string {
  return crypto.randomUUID();
}

export function CreateProductInline({
  open,
  onOpenChange,
  onCreated,
}: CreateProductInlineProps) {
  // Form state
  const [name, setName] = React.useState("");
  const [nameUk, setNameUk] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [unit, setUnit] = React.useState<ProductUnit>("kg");
  const [mainCategory, setMainCategory] = React.useState<StorageMainCategory | "">("");
  const [subCategory, setSubCategory] = React.useState<StorageSubCategory | "">("");
  const [costPerUnit, setCostPerUnit] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [storageCondition, setStorageCondition] = React.useState("refrigerated");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // GraphQL mutation
  const [, createIngredient] = useMutation(CREATE_INGREDIENT);

  // Get subcategories for selected main category
  const subCategories = React.useMemo(() => {
    if (!mainCategory) return [];
    return Object.entries(STORAGE_SUB_CATEGORY_LABELS)
      .filter(([, value]) => value.parent === mainCategory)
      .map(([key, value]) => ({
        value: key as StorageSubCategory,
        label: value.uk,
      }));
  }, [mainCategory]);

  // Reset subCategory when mainCategory changes
  React.useEffect(() => {
    setSubCategory("");
  }, [mainCategory]);

  // Reset form on close
  React.useEffect(() => {
    if (!open) {
      setName("");
      setNameUk("");
      setSku("");
      setUnit("kg");
      setMainCategory("");
      setSubCategory("");
      setCostPerUnit("");
      setQuantity("");
      setStorageCondition("refrigerated");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Назва продукту обов'язкова");
      return;
    }

    if (!quantity) {
      setError("Вкажіть кількість");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create ingredient in database
      const result = await createIngredient({
        data: {
          name: name.trim(),
          nameUk: nameUk.trim() || undefined,
          sku: sku.trim() || undefined,
          unit,
          mainCategory: mainCategory || undefined,
          subCategory: subCategory || undefined,
          costPerUnit: parseFloat(costPerUnit) || 0,
          storageCondition,
          currentStock: 0,
          minStock: 0,
          maxStock: 1000,
          isActive: true,
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      const createdIngredient = result.data?.createIngredient;
      const qty = parseFloat(quantity) || 0;
      const cost = parseFloat(costPerUnit) || 0;

      // Create delivery item
      const item: DeliveryOrderItem = {
        id: generateUUID(),
        ingredientId: createdIngredient?.documentId,
        isNew: true,
        name: name.trim(),
        nameUk: nameUk.trim() || undefined,
        sku: sku.trim() || undefined,
        unit,
        quantity: qty,
        unitCost: cost,
        totalCost: qty * cost,
        mainCategory: mainCategory || undefined,
        subCategory: subCategory || undefined,
      };

      onCreated(item);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка створення продукту");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = (parseFloat(quantity) || 0) * (parseFloat(costPerUnit) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-amber-50/50">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <span className="block">Новий продукт</span>
              <span className="text-xs font-normal text-muted-foreground">
                Створити новий товар та додати до замовлення
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Основна інформація</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="name" className="text-sm">
                    Назва (EN) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Beef tenderloin"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="nameUk" className="text-sm">
                    Назва (UA)
                  </Label>
                  <Input
                    id="nameUk"
                    value={nameUk}
                    onChange={(e) => setNameUk(e.target.value)}
                    placeholder="Яловича вирізка"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm">SKU</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="MEAT-001"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm">Одиниця виміру</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v as ProductUnit)}>
                    <SelectTrigger id="unit" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200" />

            {/* Category */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Категорія</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mainCategory" className="text-sm">Головна категорія</Label>
                  <Select
                    value={mainCategory}
                    onValueChange={(v) => setMainCategory(v as StorageMainCategory)}
                  >
                    <SelectTrigger id="mainCategory" className="h-11">
                      <SelectValue placeholder="Оберіть..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STORAGE_MAIN_CATEGORY_LABELS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.uk}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subCategory" className="text-sm">Підкатегорія</Label>
                  <Select
                    value={subCategory}
                    onValueChange={(v) => setSubCategory(v as StorageSubCategory)}
                    disabled={!mainCategory || subCategories.length === 0}
                  >
                    <SelectTrigger id="subCategory" className="h-11">
                      <SelectValue placeholder="Оберіть..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map((sub) => (
                        <SelectItem key={sub.value} value={sub.value}>
                          {sub.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageCondition" className="text-sm">Умови зберігання</Label>
                <Select value={storageCondition} onValueChange={setStorageCondition}>
                  <SelectTrigger id="storageCondition" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200" />

            {/* Quantity & Cost */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Замовлення</h3>

              <div className="grid grid-cols-2 gap-4">
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
                      {UNITS.find((u) => u.value === unit)?.label || unit}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPerUnit" className="text-sm">
                    Ціна за од.
                  </Label>
                  <div className="relative">
                    <Input
                      id="costPerUnit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(e.target.value)}
                      placeholder="0.00"
                      className="pr-10 h-11"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      грн
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Cost Preview */}
              {totalCost > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-700">Сума:</span>
                    <span className="text-xl font-bold text-emerald-700">
                      {totalCost.toLocaleString("uk-UA", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} грн
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || !quantity}
              className="h-11 px-6 bg-amber-600 hover:bg-amber-700 rounded-xl gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Створення...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Створити та додати
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
