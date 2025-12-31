"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { useTableStore } from "@/stores/table-store";
import { useKitchenStore, createKitchenTasksFromOrder } from "@/stores/kitchen-store";
import { formatPrice } from "@/lib/utils";
import { Loader2, ChefHat, UtensilsCrossed } from "lucide-react";
import { tableSessionEventsApi } from "@/lib/api-events";
import { storageHistoryApi } from "@/hooks/use-inventory-deduction";
import type { ItemComment } from "@/types/extended";

interface OrderConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  itemComments?: Record<string, ItemComment | null>;
}

export function OrderConfirmDialog({
  open,
  onOpenChange,
  onSuccess,
  itemComments = {},
}: OrderConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  // Store submitted order info for success message (cart gets cleared before success shows)
  const [submittedOrder, setSubmittedOrder] = React.useState<{ tableNumber: number; itemCount: number } | null>(null);

  // Cart store
  const items = useCartStore((state) => state.items);
  const getTotalAmount = useCartStore((state) => state.getTotalAmount);
  const clearCart = useCartStore((state) => state.clearCart);

  // Table store
  const selectedTable = useTableStore((state) => state.selectedTable);
  const updateTableStatus = useTableStore((state) => state.updateTableStatus);

  // Kitchen store
  const addKitchenTasks = useKitchenStore((state) => state.addTasks);

  const totalAmount = getTotalAmount();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirm = async () => {
    if (!selectedTable || items.length === 0) return;

    setIsSubmitting(true);
    try {
      // Generate order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get table occupied time for timer tracking
      const tableOccupiedAt = selectedTable.occupiedAt
        ? (selectedTable.occupiedAt instanceof Date
            ? selectedTable.occupiedAt.toISOString()
            : String(selectedTable.occupiedAt))
        : undefined;

      // Create kitchen tasks from cart items with comments
      const kitchenTasks = createKitchenTasksFromOrder(
        orderId,
        selectedTable.number,
        items.map((item) => ({
          menuItem: {
            id: item.menuItem.id,
            name: item.menuItem.name,
            outputType: item.menuItem.outputType,
            preparationTime: item.menuItem.preparationTime,
          },
          quantity: item.quantity,
          notes: item.notes,
          comment: itemComments[item.menuItem.id] || null,
        })),
        tableOccupiedAt // Pass actual table occupied time for timer
      );

      // Add tasks to kitchen store
      addKitchenTasks(kitchenTasks);

      // Immediate deduction for bar items (non-blocking)
      const barItems = items.filter((item) => item.menuItem.outputType === "bar");
      if (barItems.length > 0) {
        barItems.forEach((item) => {
          // Log to storage history (actual FIFO deduction happens when recipe is available)
          storageHistoryApi.addEntry({
            operationType: "use",
            productDocumentId: `menu_${item.menuItem.id}`, // Menu item reference
            productName: item.menuItem.name,
            quantity: item.quantity,
            unit: "pcs",
            orderDocumentId: orderId,
            menuItemName: item.menuItem.name,
            operatorRole: "system",
            notes: "Автоматичне списання (бар)",
          });
        });
        console.log(`[Inventory] Bar items immediate deduction logged: ${barItems.length} items`);
      }

      // Log order_taken analytics event
      const sessionId = `session_${selectedTable.id}_${Date.now()}`;
      tableSessionEventsApi.createEvent({
        tableNumber: selectedTable.number,
        sessionId,
        eventType: 'order_taken',
        actorRole: 'waiter',
        orderDocumentId: orderId,
        tableOccupiedAt,
        metadata: {
          itemCount: totalItems,
          totalAmount,
          timeToTakeOrderMs: tableOccupiedAt
            ? Date.now() - new Date(tableOccupiedAt).getTime()
            : 0,
        },
      });

      console.log("Order sent to kitchen:", {
        orderId,
        table: selectedTable.number,
        tasks: kitchenTasks.length,
        items: items.map((item) => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          notes: item.notes,
        })),
        total: totalAmount,
      });

      // Update table status to occupied (if not already)
      if (selectedTable.status !== "occupied") {
        updateTableStatus(selectedTable.id, "occupied");
      }

      // Save order info for success message BEFORE clearing cart
      setSubmittedOrder({
        tableNumber: selectedTable.number,
        itemCount: totalItems,
      });

      // Clear the cart
      clearCart();

      // Show success state
      setIsSuccess(true);

      // Auto close after success
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error("Order failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  // Reset states when dialog opens
  React.useEffect(() => {
    if (open) {
      setIsSuccess(false);
      setSubmittedOrder(null);
    }
  }, [open]);

  if (!selectedTable) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess && submittedOrder ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-100">
              <ChefHat className="h-10 w-10 text-orange-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              Замовлення відправлено на кухню!
            </DialogTitle>
            <div className="text-center mt-2 text-sm text-muted-foreground">
              Стіл {submittedOrder.tableNumber} • {submittedOrder.itemCount} позицій
            </div>
          </div>
        ) : (
          // Confirmation state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                Відправити на кухню?
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Стіл {selectedTable.number}</Badge>
                <span>•</span>
                <span>{totalItems} позицій</span>
              </div>
            </DialogHeader>

            {/* Order summary */}
            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3">Страва</th>
                    <th className="text-center py-2 w-12">К-ть</th>
                    <th className="text-right py-2 px-3 w-24">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.menuItem.id} className="border-t">
                      <td className="py-2 px-3">
                        <span className="font-medium">{item.menuItem.name}</span>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2 px-3">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-3 px-4 bg-muted/30 rounded-lg">
              <span className="font-semibold">Сума замовлення:</span>
              <span className="font-bold text-lg">{formatPrice(totalAmount)}</span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Скасувати
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="gap-2 bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <ChefHat className="h-4 w-4" />
                {isSubmitting ? "Обробка..." : "Відправити на кухню"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
