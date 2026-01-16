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
import { formatPrice } from "@/lib/utils";
import { Loader2, ChefHat, UtensilsCrossed, AlertCircle } from "lucide-react";
import { tableSessionEventsApi } from "@/lib/api-events";
import { storageHistoryApi } from "@/hooks/use-inventory-deduction";
import { useCreateOrder, useAddOrderItem, useUpdateOrderStatus } from "@/hooks/use-graphql-orders";
import type { ItemComment } from "@/types/extended";
import { COMMENT_PRESETS } from "@/types/extended";

// Helper function to generate comment preview text
function getCommentPreview(comment: ItemComment | null | undefined): string {
  if (!comment) return '';

  const parts: string[] = [];

  // Add preset labels (in Ukrainian)
  if (comment.presets && comment.presets.length > 0) {
    const presetLabels = comment.presets
      .map(key => COMMENT_PRESETS.find(p => p.key === key)?.label.uk)
      .filter(Boolean)
      .slice(0, 2); // Limit to 2 presets for brevity

    if (presetLabels.length > 0) {
      parts.push(presetLabels.join(', '));
      if (comment.presets.length > 2) {
        parts[0] += ` +${comment.presets.length - 2}`;
      }
    }
  }

  // Add custom text (truncated)
  if (comment.text) {
    const truncatedText = comment.text.length > 30
      ? comment.text.slice(0, 30) + '...'
      : comment.text;
    parts.push(truncatedText);
  }

  return parts.join(' • ') || '';
}

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
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  // Store submitted order info for success message (cart gets cleared before success shows)
  const [submittedOrder, setSubmittedOrder] = React.useState<{ tableNumber: number; itemCount: number; orderNumber?: string } | null>(null);

  // Cart store
  const items = useCartStore((state) => state.items);
  const getTotalAmount = useCartStore((state) => state.getTotalAmount);
  const clearCart = useCartStore((state) => state.clearCart);

  // Table store
  const selectedTable = useTableStore((state) => state.selectedTable);
  const updateTableStatus = useTableStore((state) => state.updateTableStatus);

  // GraphQL mutations
  const { createOrder, loading: creatingOrder } = useCreateOrder();
  const { addItem: addOrderItem, loading: addingItem } = useAddOrderItem();
  const { updateStatus: updateOrderStatus } = useUpdateOrderStatus();

  const totalAmount = getTotalAmount();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirm = async () => {
    if (!selectedTable || items.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get table occupied time for timer tracking
      const tableOccupiedAt = selectedTable.occupiedAt
        ? (selectedTable.occupiedAt instanceof Date
            ? selectedTable.occupiedAt.toISOString()
            : String(selectedTable.occupiedAt))
        : undefined;

      // ============================================
      // STEP 0: Validate table has documentId
      // ============================================
      const tableDocumentId = selectedTable.documentId;
      if (!tableDocumentId) {
        console.error("[Order] Table missing documentId:", selectedTable);
        throw new Error(
          `Стіл ${selectedTable.number} не синхронізовано з базою даних. ` +
          `Будь ласка, оновіть сторінку або перезайдіть на сторінку столів.`
        );
      }

      // ============================================
      // STEP 1: Create Order in Strapi via GraphQL
      // ============================================
      console.log("[Order] Creating order in Strapi...", { tableDocumentId });

      const order = await createOrder({
        table: tableDocumentId,
        guestCount: selectedTable.currentGuests || 1,
        notes: items.some(i => i.notes) ? items.map(i => i.notes).filter(Boolean).join('; ') : undefined,
      });

      if (!order?.documentId) {
        throw new Error("Не вдалося створити замовлення в базі даних");
      }

      const orderId = order.documentId;
      const orderNumber = order.orderNumber || orderId;
      console.log(`[Order] Created order: ${orderNumber} (${orderId})`);

      // ============================================
      // STEP 2: Create Order Items via GraphQL
      // ============================================
      console.log("[Order] Creating order items...");

      const createdItems: Array<{ documentId: string; menuItemId: string }> = [];

      for (const item of items) {
        const menuItemDocId = item.menuItem.documentId || item.menuItem.id;

        const orderItem = await addOrderItem({
          order: orderId,
          menuItem: menuItemDocId,
          quantity: item.quantity,
          unitPrice: item.menuItem.price,
          courseType: 'main',
          notes: item.notes,
        });

        if (orderItem?.documentId) {
          createdItems.push({
            documentId: orderItem.documentId,
            menuItemId: menuItemDocId,
          });
        }
      }

      console.log(`[Order] Created ${createdItems.length} order items`);
      // NOTE: Backend lifecycle (order-item/lifecycles.ts) automatically creates
      // KitchenTickets for each order item. Kitchen page fetches them via GraphQL.

      // ============================================
      // STEP 3: Update Order Status to 'confirmed'
      // ============================================
      await updateOrderStatus(orderId, 'confirmed');
      console.log("[Order] Order status updated to 'confirmed'");

      // ============================================
      // STEP 4: Bar Items - Immediate Deduction Logging
      // ============================================
      const barItems = items.filter((item) => item.menuItem.outputType === "bar");
      if (barItems.length > 0) {
        barItems.forEach((item) => {
          storageHistoryApi.addEntry({
            operationType: "use",
            productDocumentId: `menu_${item.menuItem.documentId || item.menuItem.id}`,
            productName: item.menuItem.name,
            quantity: item.quantity,
            unit: "pcs",
            orderDocumentId: orderId,
            menuItemName: item.menuItem.name,
            operatorRole: "system",
            notes: "Автоматичне списання (бар)",
          });
        });
        console.log(`[Inventory] Bar items deduction logged: ${barItems.length} items`);
      }

      // ============================================
      // STEP 5: Log Analytics Event
      // ============================================
      const sessionId = `session_${selectedTable.documentId || selectedTable.id}_${Date.now()}`;
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
          orderNumber,
          timeToTakeOrderMs: tableOccupiedAt
            ? Date.now() - new Date(tableOccupiedAt).getTime()
            : 0,
        },
      });

      console.log("[Order] Complete:", {
        orderId,
        orderNumber,
        table: selectedTable.number,
        items: items.length,
        total: totalAmount,
      });

      // Update table status to occupied (if not already)
      if (selectedTable.status !== "occupied") {
        updateTableStatus(selectedTable.documentId || selectedTable.id, "occupied");
      }

      // Save order info for success message BEFORE clearing cart
      setSubmittedOrder({
        tableNumber: selectedTable.number,
        itemCount: totalItems,
        orderNumber,
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
      console.error("[Order] Failed:", error);
      setSubmitError(error instanceof Error ? error.message : "Помилка при створенні замовлення");
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
      setSubmitError(null);
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
              {submittedOrder.orderNumber && (
                <Badge variant="secondary" className="mb-2">
                  #{submittedOrder.orderNumber}
                </Badge>
              )}
              <div>Стіл {submittedOrder.tableNumber} • {submittedOrder.itemCount} позицій</div>
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
                  {items.map((item) => {
                    const menuItemKey = item.menuItem.documentId || item.menuItem.id;
                    const comment = itemComments[menuItemKey];
                    const commentPreview = getCommentPreview(comment);
                    // Determine unit for weight/volume
                    const weightUnit = item.menuItem.outputType === 'bar' ? 'мл' : 'г';

                    return (
                      <tr key={menuItemKey} className="border-t">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.menuItem.name}</span>
                            {item.menuItem.weight && (
                              <span className="text-xs text-muted-foreground">
                                {item.menuItem.weight}{weightUnit}
                              </span>
                            )}
                          </div>
                          {(commentPreview || item.notes) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {commentPreview || item.notes}
                            </p>
                          )}
                        </td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2 px-3">
                          {formatPrice(item.menuItem.price * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-3 px-4 bg-muted/30 rounded-lg">
              <span className="font-semibold">Сума замовлення:</span>
              <span className="font-bold text-lg">{formatPrice(totalAmount)}</span>
            </div>

            {/* Error message */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <DialogFooter className="border-t pt-4">
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full h-11 gap-2 bg-orange-600 hover:bg-orange-700 text-base font-medium rounded-xl"
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
