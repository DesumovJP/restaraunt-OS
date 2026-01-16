"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Loader2,
  Plus,
  ShoppingCart,
  AlertCircle,
  Clock,
  Receipt,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useOrdersStore } from "@/stores/orders-store";
import { useCartStore } from "@/stores/cart-store";
import type { ExtendedOrder } from "@/types/extended";
import type { ItemComment, CourseType } from "@/types/extended";

interface AddItemsToOrderDialogProps {
  tableNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemComments?: Record<string, ItemComment | null>;
}

export function AddItemsToOrderDialog({
  tableNumber,
  isOpen,
  onClose,
  onSuccess,
  itemComments = {},
}: AddItemsToOrderDialogProps) {
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    itemsAdded: number;
    ticketsCreated: number;
    newTotal: number;
  } | null>(null);

  const getOrdersForTable = useOrdersStore((state) => state.getOrdersForTable);
  const addItemsToOrderAsync = useOrdersStore((state) => state.addItemsToOrderAsync);
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // Get active orders for the table
  const activeOrders = React.useMemo(() => {
    const orders = getOrdersForTable(tableNumber);
    return orders.filter(
      (order) =>
        order.status !== "served" &&
        order.status !== "cancelled"
    );
  }, [getOrdersForTable, tableNumber]);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedOrderId(null);
      setIsSuccess(false);
      setError(null);
      setResult(null);
      // Auto-select if there's only one active order
      if (activeOrders.length === 1) {
        setSelectedOrderId(activeOrders[0].documentId);
      }
    }
  }, [isOpen, activeOrders]);

  const handleConfirm = async () => {
    if (!selectedOrderId || cartItems.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Prepare items for API
      const items = cartItems.map((item) => {
        const menuItemKey = item.menuItem.documentId || item.menuItem.id;
        const comment = itemComments[menuItemKey];

        return {
          menuItemId: item.menuItem.documentId || item.menuItem.id,
          quantity: item.quantity,
          notes: comment?.text || undefined,
          courseType: "main" as CourseType, // Default, could be made selectable
          modifiers: comment?.presets || [],
        };
      });

      const apiResult = await addItemsToOrderAsync(
        selectedOrderId,
        items
      );

      setResult({
        itemsAdded: apiResult.items.length,
        ticketsCreated: apiResult.tickets.length,
        newTotal: apiResult.order.totalAmount,
      });
      setIsSuccess(true);

      // Clear cart after successful add
      clearCart();

      // Auto-close after success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Помилка при додаванні страв"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Success state
  if (isSuccess && result) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Страви додано</DialogTitle>
            <DialogDescription className="mb-4">
              Успішно додано до замовлення
            </DialogDescription>

            <div className="w-full space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                <span className="text-emerald-700">Позицій додано</span>
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-emerald-800 border-emerald-300"
                >
                  {result.itemsAdded}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                <span className="text-blue-700">Нова сума замовлення</span>
                <span className="font-bold text-blue-800">
                  {formatPrice(result.newTotal)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <div className="rounded-full bg-emerald-100 p-2">
              <Plus className="h-5 w-5" />
            </div>
            Додати страви до замовлення
          </DialogTitle>
          <DialogDescription>
            Виберіть замовлення для столу №{tableNumber}, до якого додати страви
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4 py-4">
          {/* Cart items summary */}
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Страви для додавання ({cartItems.length})</span>
            </div>
            <div className="space-y-1 text-sm text-slate-600 max-h-24 overflow-y-auto">
              {cartItems.map((item) => (
                <div
                  key={item.menuItem.documentId || item.menuItem.id}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.menuItem.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active orders */}
          {activeOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Немає активних замовлень для цього столу</p>
              <p className="text-xs mt-1">
                Спочатку створіть нове замовлення
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Активні замовлення ({activeOrders.length})
              </p>
              <div className="h-[200px] overflow-y-auto pr-4">
                <div className="space-y-2">
                  {activeOrders.map((order) => {
                    const isSelected = selectedOrderId === order.documentId;
                    return (
                      <button
                        key={order.documentId}
                        onClick={() => setSelectedOrderId(order.documentId)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                          "hover:bg-accent",
                          isSelected &&
                            "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-offset-2"
                        )}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              #{order.documentId.slice(-6)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                order.status === "preparing" &&
                                  "bg-amber-50 text-amber-700 border-amber-300",
                                order.status === "pending" &&
                                  "bg-blue-50 text-blue-700 border-blue-300",
                                order.status === "confirmed" &&
                                  "bg-purple-50 text-purple-700 border-purple-300",
                                order.status === "ready" &&
                                  "bg-emerald-50 text-emerald-700 border-emerald-300"
                              )}
                            >
                              {order.status === "preparing" && "Готується"}
                              {order.status === "pending" && "Очікує"}
                              {order.status === "confirmed" && "Підтверджено"}
                              {order.status === "ready" && "Готово"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{order.items.length} позицій</span>
                            <span>•</span>
                            <span>{formatPrice(order.totalAmount || 0)}</span>
                            {order.createdAt && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(order.createdAt).toLocaleTimeString(
                                    "uk-UA",
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                !selectedOrderId || cartItems.length === 0 || isLoading
              }
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Додати страви
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
