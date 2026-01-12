"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCartStore, type PaymentMethod } from "@/stores/cart-store";
import { useTableStore } from "@/stores/table-store";
import { formatPrice, cn } from "@/lib/utils";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  Receipt as ReceiptIcon,
  Printer,
  Users,
  AlertCircle,
} from "lucide-react";

const PAYMENT_METHODS = [
  { id: "card" as PaymentMethod, label: "Картка", icon: CreditCard },
  { id: "cash" as PaymentMethod, label: "Готівка", icon: DollarSign },
  { id: "paylater" as PaymentMethod, label: "На рахунок", icon: Clock },
] as const;

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Receipt {
  id: string;
  tableNumber: number;
  tableSessionDuration: number; // in milliseconds
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  comment?: string;
  waiterId: string;
  waiterName: string;
  createdAt: string;
  paidAt: string;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  onSuccess,
}: CheckoutDialogProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const [receipt, setReceipt] = React.useState<Receipt | null>(null);

  // Cart store
  const items = useCartStore((state) => state.items);
  const paymentMethod = useCartStore((state) => state.paymentMethod);
  const setPaymentMethod = useCartStore((state) => state.setPaymentMethod);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTax = useCartStore((state) => state.getTax);
  const getTotalAmount = useCartStore((state) => state.getTotalAmount);
  const clearCart = useCartStore((state) => state.clearCart);

  // Table store
  const selectedTable = useTableStore((state) => state.selectedTable);
  const updateTableStatus = useTableStore((state) => state.updateTableStatus);
  const clearSelectedTable = useTableStore((state) => state.clearSelectedTable);

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotalAmount();

  // Calculate table session duration
  const tableSessionDuration = React.useMemo(() => {
    if (!selectedTable?.occupiedAt) return 0;
    const startTime = selectedTable.occupiedAt instanceof Date
      ? selectedTable.occupiedAt.getTime()
      : new Date(selectedTable.occupiedAt).getTime();
    return Date.now() - startTime;
  }, [selectedTable?.occupiedAt]);

  // Format duration for display
  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours} год ${minutes} хв`;
    }
    return `${minutes} хв`;
  };

  const handleCheckout = async () => {
    if (items.length === 0 || !selectedTable) return;

    setIsProcessing(true);

    try {
      // Create receipt record
      const newReceipt: Receipt = {
        id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tableNumber: selectedTable.number,
        tableSessionDuration,
        items: items.map((item) => ({
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price,
          notes: item.notes,
        })),
        subtotal,
        tax,
        total,
        paymentMethod,
        comment: comment.trim() || undefined,
        waiterId: "waiter-1", // TODO: Get from auth context
        waiterName: "Courtney Henry", // TODO: Get from auth context
        createdAt: selectedTable.occupiedAt
          ? (selectedTable.occupiedAt instanceof Date
              ? selectedTable.occupiedAt.toISOString()
              : selectedTable.occupiedAt)
          : new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };

      // TODO: Save receipt to backend via GraphQL mutation
      // await saveReceipt(newReceipt);
      console.log("Receipt saved:", newReceipt);

      // Store receipt for display
      setReceipt(newReceipt);

      // Free the table
      updateTableStatus(selectedTable.id, "free");

      // Clear the cart
      clearCart();

      // Show success state
      setIsComplete(true);
    } catch (error) {
      console.error("Checkout failed:", error);
      // TODO: Show error toast
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isComplete) {
      // Reset state
      setIsComplete(false);
      setReceipt(null);
      setComment("");
      clearSelectedTable();
      onSuccess?.();
    }
    onOpenChange(false);
  };

  const handlePrintReceipt = () => {
    // TODO: Implement actual receipt printing
    window.print();
  };

  if (isComplete && receipt) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-xl mb-2">Оплату прийнято!</DialogTitle>
            <p className="text-muted-foreground mb-6">
              Чек #{receipt.id.slice(-6)} • Стіл {receipt.tableNumber}
            </p>

            {/* Receipt summary */}
            <div className="w-full bg-muted/50 rounded-lg p-4 text-left space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Час столу:</span>
                <span className="font-medium">{formatDuration(receipt.tableSessionDuration)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Позицій:</span>
                <span className="font-medium">{receipt.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Спосіб оплати:</span>
                <span className="font-medium">
                  {PAYMENT_METHODS.find((m) => m.id === receipt.paymentMethod)?.label}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Загалом:</span>
                <span className="font-bold text-lg">{formatPrice(receipt.total)}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrintReceipt}
              >
                <Printer className="h-4 w-4 mr-2" />
                Друкувати
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Готово
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptIcon className="h-5 w-5" />
            Оформлення рахунку
          </DialogTitle>
        </DialogHeader>

        {/* Table info */}
        {selectedTable && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                Стіл {selectedTable.number}
              </Badge>
              {selectedTable.occupiedAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDuration(tableSessionDuration)}
                </div>
              )}
            </div>
            {selectedTable.capacity && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                до {selectedTable.capacity}
              </div>
            )}
          </div>
        )}

        {/* Order items */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-start py-2 border-b last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.quantity}×</span>
                  <span>{item.menuItem.name}</span>
                </div>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                )}
              </div>
              <span className="font-medium">
                {formatPrice(item.menuItem.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Підсумок</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ПДВ (20%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>До сплати</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="text-sm font-medium mb-2 block">Спосіб оплати</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isActive = paymentMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Коментар (необов'язково)
          </label>
          <Textarea
            placeholder="Додаткові примітки до замовлення..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            onClick={handleCheckout}
            disabled={items.length === 0 || isProcessing}
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Обробка...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Прийняти оплату {formatPrice(total)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
