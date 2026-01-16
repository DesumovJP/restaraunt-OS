"use client";

import * as React from "react";
import { useQuery } from "urql";
import { GET_ALL_SUPPLIERS } from "@/graphql/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Truck,
  Plus,
  Sparkles,
  Package,
  Trash2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DeliveryItemRow, DeliveryItemRowMobile } from "./delivery-item-row";
import { AddProductDialog } from "./add-product-dialog";
import { CreateProductInline } from "./create-product-inline";
import { DeliveryExportMenu, DeliveryExportButtons } from "./delivery-export-menu";
import type { DeliveryOrder, DeliveryOrderItem, DeliverySupplier } from "@/types/delivery";

interface DeliveryOrderFormProps {
  onOrderChange?: (order: DeliveryOrder) => void;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function createEmptyOrder(): DeliveryOrder {
  return {
    id: generateUUID(),
    items: [],
    totalAmount: 0,
    createdAt: new Date().toISOString(),
  };
}

export function DeliveryOrderForm({ onOrderChange }: DeliveryOrderFormProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Order state
  const [order, setOrder] = React.useState<DeliveryOrder>(createEmptyOrder);
  const [supplierId, setSupplierId] = React.useState("");

  // Dialog states
  const [addProductOpen, setAddProductOpen] = React.useState(false);
  const [createProductOpen, setCreateProductOpen] = React.useState(false);

  // Fetch suppliers
  const [suppliersResult] = useQuery({
    query: GET_ALL_SUPPLIERS,
  });

  const suppliers: DeliverySupplier[] = suppliersResult.data?.suppliers || [];
  const selectedSupplier = suppliers.find((s) => s.documentId === supplierId);

  // Update order when items change
  const updateOrder = React.useCallback((updates: Partial<DeliveryOrder>) => {
    setOrder((prev) => {
      const updated = { ...prev, ...updates };
      // Recalculate total
      updated.totalAmount = updated.items.reduce((sum, item) => sum + item.totalCost, 0);
      return updated;
    });
  }, []);

  // Notify parent of changes
  React.useEffect(() => {
    const orderWithSupplier: DeliveryOrder = {
      ...order,
      supplierId: supplierId || undefined,
      supplierName: selectedSupplier?.name,
      supplierEmail: selectedSupplier?.email,
    };
    onOrderChange?.(orderWithSupplier);
  }, [order, supplierId, selectedSupplier, onOrderChange]);

  // Add item to order
  const handleAddItem = (item: DeliveryOrderItem) => {
    updateOrder({ items: [...order.items, item] });
  };

  // Update item in order
  const handleUpdateItem = (updatedItem: DeliveryOrderItem) => {
    updateOrder({
      items: order.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    });
  };

  // Remove item from order
  const handleRemoveItem = (itemId: string) => {
    updateOrder({
      items: order.items.filter((item) => item.id !== itemId),
    });
  };

  // Clear order
  const handleClearOrder = () => {
    setOrder(createEmptyOrder());
    setSupplierId("");
  };

  // Get existing ingredient IDs (to exclude from search)
  const existingIngredientIds = order.items
    .filter((item) => item.ingredientId)
    .map((item) => item.ingredientId!);

  const totalItems = order.items.length;
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Supplier Selection */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Постачальник
              </label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Оберіть постачальника" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.documentId} value={supplier.documentId}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{supplier.name}</span>
                        {supplier.phone && (
                          <span className="text-xs text-muted-foreground">
                            {supplier.phone}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50/80 py-3 px-4 border-b">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-600" />
              Товари
              {totalItems > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {totalItems}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddProductOpen(true)}
                className="gap-2 h-9 rounded-lg"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Додати</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateProductOpen(true)}
                className="gap-2 h-9 rounded-lg bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Новий</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {order.items.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-slate-400" />
              </div>
              <p className="font-medium text-slate-600 mb-2">Список порожній</p>
              <p className="text-sm text-muted-foreground">
                Натисніть "Додати" щоб обрати товар зі складу
              </p>
            </div>
          ) : (
            <>
              {/* Table Header (desktop) */}
              {!isMobile && (
                <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-slate-50 border-b text-xs font-medium text-muted-foreground">
                  <div className="flex-1">Назва</div>
                  <div className="w-16 text-center">Од.</div>
                  <div className="w-28 text-center">Кількість</div>
                  <div className="w-9"></div>
                </div>
              )}

              {/* Items */}
              <div className="divide-y">
                {order.items.map((item) =>
                  isMobile ? (
                    <DeliveryItemRowMobile
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onRemove={handleRemoveItem}
                    />
                  ) : (
                    <DeliveryItemRow
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onRemove={handleRemoveItem}
                    />
                  )
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary & Actions */}
      {order.items.length > 0 && (
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Summary */}
              <div>
                <p className="text-sm text-muted-foreground">Позицій у замовленні</p>
                <p className="text-2xl font-bold text-slate-700">{totalItems}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isMobile ? (
                  <DeliveryExportButtons
                    order={{
                      ...order,
                      supplierId: supplierId || undefined,
                      supplierName: selectedSupplier?.name,
                      supplierEmail: selectedSupplier?.email,
                    }}
                    supplier={selectedSupplier}
                  />
                ) : (
                  <DeliveryExportMenu
                    order={{
                      ...order,
                      supplierId: supplierId || undefined,
                      supplierName: selectedSupplier?.name,
                      supplierEmail: selectedSupplier?.email,
                    }}
                    supplier={selectedSupplier}
                  />
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size={isMobile ? "icon" : "sm"}
                      className={cn(
                        "text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl",
                        isMobile ? "h-10 w-10" : "h-10 gap-2"
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                      {!isMobile && <span>Очистити</span>}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Очистити замовлення?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Всі товари буде видалено зі списку. Цю дію неможливо скасувати.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearOrder}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Очистити
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddProductDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        onAdd={handleAddItem}
        existingIds={existingIngredientIds}
      />

      <CreateProductInline
        open={createProductOpen}
        onOpenChange={setCreateProductOpen}
        onCreated={handleAddItem}
      />
    </div>
  );
}
