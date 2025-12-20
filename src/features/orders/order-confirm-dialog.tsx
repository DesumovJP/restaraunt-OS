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
import { formatPrice } from "@/lib/utils";
import { CheckCircle, Loader2 } from "lucide-react";
import type { CartItem } from "@/types";

interface OrderConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  tableNumber: number | null;
  totalAmount: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function OrderConfirmDialog({
  open,
  onOpenChange,
  items,
  tableNumber,
  totalAmount,
  onConfirm,
  onCancel,
}: OrderConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      setIsSuccess(true);
      // Auto close after success
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      console.error("Order failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onCancel();
      onOpenChange(false);
    }
  };

  // Reset success state when dialog opens
  React.useEffect(() => {
    if (open) {
      setIsSuccess(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <DialogTitle className="text-center text-xl">
              Замовлення створено!
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              Стіл #{tableNumber} • {formatPrice(totalAmount)}
            </DialogDescription>
          </div>
        ) : (
          // Confirmation state
          <>
            <DialogHeader>
              <DialogTitle>Підтвердження замовлення</DialogTitle>
              <DialogDescription>
                Стіл #{tableNumber} • {items.length} позицій
              </DialogDescription>
            </DialogHeader>

            {/* Order summary */}
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2">Страва</th>
                    <th className="text-center py-2 w-12">К-ть</th>
                    <th className="text-right py-2 w-20">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.menuItem.id} className="border-b last:border-0">
                      <td className="py-2">
                        <span className="font-medium">{item.menuItem.name}</span>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">
                            {item.notes}
                          </p>
                        )}
                      </td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2">
                  <tr>
                    <td colSpan={2} className="py-3 font-semibold">
                      Разом:
                    </td>
                    <td className="text-right py-3 font-semibold text-primary">
                      {formatPrice(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Скасувати
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Створення..." : "Підтвердити"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
