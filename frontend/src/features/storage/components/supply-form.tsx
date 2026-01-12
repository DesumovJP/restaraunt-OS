"use client";

import * as React from "react";
import { useQuery, useMutation } from "urql";
import { GET_ALL_INGREDIENTS, GET_ALL_SUPPLIERS } from "@/graphql/queries";
import { CREATE_STOCK_BATCH, CREATE_INVENTORY_MOVEMENT } from "@/graphql/mutations";
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
import { Loader2, Package, Truck, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Ingredient {
  documentId: string;
  name: string;
  nameUk?: string;
  sku: string;
  unit: string;
  currentStock: number;
  costPerUnit?: number;
}

interface Supplier {
  documentId: string;
  name: string;
  contactName?: string;
  phone?: string;
}

function generateBatchNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `B${year}${month}${day}-${random}`;
}

export function SupplyForm({ open, onOpenChange, onSuccess }: SupplyFormProps) {
  // Form state
  const [ingredientId, setIngredientId] = React.useState("");
  const [supplierId, setSupplierId] = React.useState("");
  const [grossQuantity, setGrossQuantity] = React.useState("");
  const [unitCost, setUnitCost] = React.useState("");
  const [invoiceNumber, setInvoiceNumber] = React.useState("");
  const [batchNumber, setBatchNumber] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch ingredients
  const [ingredientsResult] = useQuery({
    query: GET_ALL_INGREDIENTS,
    pause: !open,
  });

  // Fetch suppliers
  const [suppliersResult] = useQuery({
    query: GET_ALL_SUPPLIERS,
    pause: !open,
  });

  // Mutations
  const [, createStockBatch] = useMutation(CREATE_STOCK_BATCH);
  const [, createInventoryMovement] = useMutation(CREATE_INVENTORY_MOVEMENT);

  const ingredients: Ingredient[] = ingredientsResult.data?.ingredients || [];
  const suppliers: Supplier[] = suppliersResult.data?.suppliers || [];
  const selectedIngredient = ingredients.find((i) => i.documentId === ingredientId);

  // Calculate total cost
  const totalCost = React.useMemo(() => {
    const qty = parseFloat(grossQuantity) || 0;
    const cost = parseFloat(unitCost) || 0;
    return qty * cost;
  }, [grossQuantity, unitCost]);

  // Auto-fill unit cost from ingredient
  React.useEffect(() => {
    if (selectedIngredient?.costPerUnit && !unitCost) {
      setUnitCost(selectedIngredient.costPerUnit.toString());
    }
  }, [selectedIngredient, unitCost]);

  // Generate batch number on open
  React.useEffect(() => {
    if (open && !batchNumber) {
      setBatchNumber(generateBatchNumber());
    }
  }, [open, batchNumber]);

  // Reset form on close
  React.useEffect(() => {
    if (!open) {
      setIngredientId("");
      setSupplierId("");
      setGrossQuantity("");
      setUnitCost("");
      setInvoiceNumber("");
      setBatchNumber("");
      setExpiryDate("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ingredientId || !grossQuantity || !unitCost) {
      setError("Заповніть обов'язкові поля");
      return;
    }

    setIsSubmitting(true);

    try {
      const quantity = parseFloat(grossQuantity);
      const cost = parseFloat(unitCost);

      // Create stock batch
      const batchResult = await createStockBatch({
        data: {
          ingredient: ingredientId,
          supplier: supplierId || undefined,
          grossIn: quantity,
          netAvailable: quantity, // Initially same as gross
          unitCost: cost,
          totalCost: quantity * cost,
          batchNumber: batchNumber || generateBatchNumber(),
          invoiceNumber: invoiceNumber || undefined,
          expiryDate: expiryDate || undefined,
          receivedAt: new Date().toISOString(),
          status: "available",
        },
      });

      if (batchResult.error) {
        throw new Error(batchResult.error.message);
      }

      // Create inventory movement for receiving
      await createInventoryMovement({
        data: {
          ingredient: ingredientId,
          stockBatch: batchResult.data?.createStockBatch?.documentId,
          movementType: "receive",
          quantity: quantity,
          unit: selectedIngredient?.unit || "kg",
          unitCost: cost,
          totalCost: quantity * cost,
          reason: "Поставка товару",
          reasonCode: "supply",
          notes: invoiceNumber ? `Накладна: ${invoiceNumber}` : undefined,
        },
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка створення партії");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-slate-50/50">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Truck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="block">Прийом поставки</span>
              <span className="text-xs font-normal text-muted-foreground">
                Заповніть інформацію про товар
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Scrollable content */}
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Product Selection Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Продукт та постачальник
              </h3>

              {/* Ingredient */}
              <div className="space-y-2">
                <Label htmlFor="ingredient" className="text-sm">
                  Продукт <span className="text-destructive">*</span>
                </Label>
                <Select value={ingredientId} onValueChange={setIngredientId}>
                  <SelectTrigger id="ingredient" className="h-11">
                    <SelectValue placeholder="Оберіть продукт" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing.documentId} value={ing.documentId}>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{ing.nameUk || ing.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({ing.unit})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm">Постачальник</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger id="supplier" className="h-11">
                    <SelectValue placeholder="Оберіть постачальника" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.documentId} value={sup.documentId}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200" />

            {/* Quantity Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Кількість та вартість</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm">
                    Кількість <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={grossQuantity}
                      onChange={(e) => setGrossQuantity(e.target.value)}
                      placeholder="0.00"
                      className="pr-12 h-11"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {selectedIngredient?.unit || "кг"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitCost" className="text-sm">
                    Ціна за од. <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="unitCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="0.00"
                      className="pr-10 h-11"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      грн
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Cost Display */}
              {totalCost > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-700">
                      Загальна вартість:
                    </span>
                    <span className="text-xl font-bold text-emerald-700">
                      {totalCost.toLocaleString("uk-UA", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      грн
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-200" />

            {/* Document Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Документи та терміни</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice" className="text-sm">Номер накладної</Label>
                  <Input
                    id="invoice"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-001"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch" className="text-sm">Номер партії</Label>
                  <Input
                    id="batch"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="B240111-001"
                    className="h-11"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiry" className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Термін придатності
                </Label>
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-11"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none h-11"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none h-11 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Збереження...
                </>
              ) : (
                "Прийняти поставку"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
