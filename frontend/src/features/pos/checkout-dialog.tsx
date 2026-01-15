'use client';

import * as React from 'react';
import { useQuery } from 'urql';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DoorOpen,
  CreditCard,
  Banknote,
  Loader2,
  CheckCircle2,
  Receipt,
  UtensilsCrossed,
  AlertTriangle,
} from 'lucide-react';
import { authFetch } from '@/stores/auth-store';
import { GET_ACTIVE_ORDERS } from '@/graphql/queries';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableDocumentId: string | null;
  tableNumber: number | null;
  onSuccess?: () => void;
}

interface OrderItem {
  documentId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  menuItem: {
    documentId: string;
    name: string;
    price: number;
  };
}

interface Order {
  documentId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  table: {
    documentId: string;
    number: number;
  };
}

export function CheckoutDialog({
  open,
  onOpenChange,
  tableDocumentId,
  tableNumber,
  onSuccess,
}: CheckoutDialogProps) {
  const [closing, setClosing] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'card'>('cash');
  const [tipAmount, setTipAmount] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  // Fetch active orders
  const [{ data, fetching }] = useQuery({
    query: GET_ACTIVE_ORDERS,
    pause: !open,
    requestPolicy: 'network-only',
  });

  // Filter orders for this table
  const tableOrders: Order[] = React.useMemo(() => {
    if (!data?.orders || !tableNumber) return [];
    return data.orders.filter(
      (order: Order) => order.table?.number === tableNumber && order.status !== 'paid'
    );
  }, [data?.orders, tableNumber]);

  // Calculate totals and check for unserved items
  const { allItems, subtotal, itemCount, unservedItems } = React.useMemo(() => {
    const items: Array<{ name: string; quantity: number; price: number; status: string }> = [];
    const unserved: Array<{ name: string; quantity: number; status: string }> = [];
    let total = 0;
    let count = 0;

    for (const order of tableOrders) {
      for (const item of order.items || []) {
        const itemName = item.menuItem?.name || 'Невідома страва';
        items.push({
          name: itemName,
          quantity: item.quantity,
          price: item.totalPrice || item.unitPrice * item.quantity,
          status: item.status,
        });
        total += item.totalPrice || item.unitPrice * item.quantity;
        count += item.quantity;

        // Check if item is not served and not cancelled
        if (item.status !== 'served' && item.status !== 'cancelled') {
          unserved.push({
            name: itemName,
            quantity: item.quantity,
            status: item.status,
          });
        }
      }
    }

    return { allItems: items, subtotal: total, itemCount: count, unservedItems: unserved };
  }, [tableOrders]);

  // Check if checkout is allowed (all items must be served or cancelled)
  const canCheckout = unservedItems.length === 0;

  const taxRate = 0.2;
  const tax = subtotal * taxRate;
  const tip = tipAmount ? parseFloat(tipAmount) : 0;
  const grandTotal = subtotal + tax + tip;

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setPaymentMethod('cash');
      setTipAmount('');
      setError(null);
    }
  }, [open]);

  const handleCheckout = async () => {
    if (!tableDocumentId) {
      setError('Не вдалося знайти столик');
      return;
    }

    setClosing(true);
    setError(null);

    try {
      const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
      const response = await authFetch(`${STRAPI_URL}/api/tables/${tableDocumentId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          tipAmount: tip,
          notes: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Не вдалося закрити столик');
      }

      const result = await response.json();
      console.log('[Checkout] Table closed:', result);

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('[Checkout] Failed:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося закрити столик');
    } finally {
      setClosing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'served':
        return <Badge variant="secondary" className="text-xs">Подано</Badge>;
      case 'ready':
        return <Badge className="text-xs bg-success">Готово</Badge>;
      case 'cooking':
      case 'sent':
        return <Badge variant="outline" className="text-xs text-warning border-warning">Готується</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Розрахунок • Стіл {tableNumber}
          </DialogTitle>
          <DialogDescription>
            Перегляньте замовлення та оберіть спосіб оплати
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tableOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Немає активних замовлень</p>
          </div>
        ) : (
          <DialogBody className="flex-1 overflow-y-auto space-y-4">
            {/* Items list */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Замовлено ({itemCount} поз.):
              </p>
              <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-2">
                {allItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.quantity}×
                      </span>
                      <span className="text-sm truncate">{item.name}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <span className="text-sm font-medium shrink-0 ml-2">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Підсумок:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ПДВ (20%):</span>
                <span>{formatPrice(tax)}</span>
              </div>
              {tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Чайові:</span>
                  <span>{formatPrice(tip)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                <span>До сплати:</span>
                <span className="text-primary">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Спосіб оплати:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Готівка
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Картка
                </Button>
              </div>
            </div>

            {/* Tip amount */}
            <div className="space-y-2">
              <Label htmlFor="checkoutTip" className="text-sm font-medium">
                Чайові (₴)
              </Label>
              <Input
                id="checkoutTip"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
              />
            </div>

            {/* Warning for unserved items */}
            {!canCheckout && unservedItems.length > 0 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-warning font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Не всі страви видані</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {unservedItems.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <span>{item.quantity}× {item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.status === 'pending' && 'Очікує'}
                        {item.status === 'in_progress' && 'Готується'}
                        {item.status === 'ready' && 'Готово'}
                        {item.status === 'queued' && 'В черзі'}
                        {item.status === 'returned' && 'Повернено'}
                      </Badge>
                    </div>
                  ))}
                  {unservedItems.length > 5 && (
                    <div className="text-xs text-muted-foreground pt-1">
                      ...і ще {unservedItems.length - 5} позицій
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">
                {error}
              </div>
            )}
          </DialogBody>
        )}

        <DialogFooter className="pt-4 border-t">
          <Button
            onClick={handleCheckout}
            disabled={closing || tableOrders.length === 0 || !canCheckout}
            className="w-full h-12 bg-success hover:bg-success/90 disabled:bg-muted disabled:text-muted-foreground text-base font-medium rounded-xl"
          >
            {closing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Обробка...
              </>
            ) : !canCheckout ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Видайте всі страви
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Підтвердити оплату
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
