"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Users,
  Check,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Phone
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useScheduledOrderModeStore } from "@/stores/scheduled-order-mode-store";
import { useScheduledOrdersStore } from "@/stores/scheduled-orders-store";
import type { ItemComment } from "@/types/extended";

interface ScheduledOrderSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemComments: Record<string, ItemComment | null>;
}

export function ScheduledOrderSaveDialog({
  open,
  onOpenChange,
  itemComments,
}: ScheduledOrderSaveDialogProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState("");

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalAmount = useCartStore((state) => state.getTotalAmount);

  const {
    reservationId,
    reservationCode,
    tableId,
    tableNumber,
    scheduledFor,
    contactName,
    contactPhone,
    guestCount,
    exitScheduledMode,
    getFormattedDateTime,
  } = useScheduledOrderModeStore();

  const addOrder = useScheduledOrdersStore((state) => state.addOrder);
  const updateOrder = useScheduledOrdersStore((state) => state.updateOrder);

  const handleSave = async () => {
    if (!scheduledFor || !tableId) {
      setErrorMessage("Відсутні дані бронювання");
      setStatus("error");
      return;
    }

    setStatus("saving");

    try {
      // Calculate prepStartAt (30 minutes before scheduled time)
      const scheduledDate = new Date(scheduledFor);
      const prepStartDate = new Date(scheduledDate.getTime() - 30 * 60 * 1000);

      // Format items for scheduled order
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItem.documentId || item.menuItem.id,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
        notes: item.notes || "",
        comment: itemComments[item.menuItem.id] || null,
      }));

      const totalAmount = getTotalAmount();

      // Create scheduled order in store
      const orderId = addOrder({
        tableNumber: tableNumber!,
        tableId: tableId,
        items: orderItems,
        totalAmount,
        scheduledFor: scheduledFor,
        prepStartAt: prepStartDate.toISOString(),
        guestCount: guestCount || 1,
        contact: contactName && contactPhone ? {
          name: contactName,
          phone: contactPhone,
        } : undefined,
      });

      // TODO: Also create in Strapi via GraphQL mutation
      // This would link the scheduled order to the reservation

      setStatus("success");

      // Wait a moment to show success, then cleanup
      setTimeout(() => {
        clearCart();
        exitScheduledMode();
        onOpenChange(false);
        router.push("/pos/waiter/calendar");
      }, 1500);

    } catch (error) {
      console.error("Failed to save scheduled order:", error);
      setErrorMessage(error instanceof Error ? error.message : "Не вдалося зберегти замовлення");
      setStatus("error");
    }
  };

  const formattedDateTime = getFormattedDateTime();
  const totalAmount = getTotalAmount();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Зберегти попереднє замовлення
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Reservation info */}
          <div className="p-4 rounded-lg bg-purple-50 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700">Дата та час</span>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Clock className="h-4 w-4" />
                {formattedDateTime}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700">Стіл</span>
              <span className="text-sm font-medium">№ {tableNumber}</span>
            </div>

            {guestCount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700">Гостей</span>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  {guestCount}
                </div>
              </div>
            )}

            {contactName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700">Контакт</span>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Phone className="h-4 w-4" />
                  {contactName}
                </div>
              </div>
            )}

            {reservationCode && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700">Код</span>
                <span className="text-sm font-mono font-medium">{reservationCode}</span>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ShoppingBag className="h-4 w-4" />
                <span>{totalItems} позицій</span>
              </div>
              <span className="text-lg font-bold">{formatPrice(totalAmount)}</span>
            </div>

            {/* Items list preview */}
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600">
                    {item.quantity}× {item.menuItem.name}
                  </span>
                  <span className="text-slate-500">
                    {formatPrice(item.menuItem.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Status messages */}
          {status === "success" && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">Замовлення збережено</p>
                <p className="text-sm text-green-600">Перенаправлення на календар...</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Помилка</p>
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {status !== "success" && (
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={status === "saving"}
              className="flex-1"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleSave}
              disabled={status === "saving" || items.length === 0}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {status === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Збереження...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Зберегти
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
