"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";
import type { CartItem } from "@/types";

interface CartPanelProps {
  items: CartItem[];
  tableNumber: number | null;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onUpdateNotes: (menuItemId: string, notes: string) => void;
  onSetTable: (tableNumber: number | null) => void;
  onConfirmOrder: () => void;
  onClearCart: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function CartPanel({
  items,
  tableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onSetTable,
  onConfirmOrder,
  onClearCart,
  isOpen = true,
  onClose,
  className,
}: CartPanelProps) {
  const totalAmount = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Table number input
  const [tableInput, setTableInput] = React.useState(
    tableNumber?.toString() || ""
  );

  React.useEffect(() => {
    setTableInput(tableNumber?.toString() || "");
  }, [tableNumber]);

  const handleTableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTableInput(value);
    const num = parseInt(value, 10);
    onSetTable(isNaN(num) ? null : num);
  };

  // Can confirm order only if we have items and table number
  const canConfirm = items.length > 0 && tableNumber !== null && tableNumber > 0;

  return (
    <Card
      className={cn(
        "flex flex-col h-full",
        // Mobile: slide-in panel
        "fixed inset-y-0 right-0 w-full max-w-sm z-50 md:relative md:inset-auto md:w-auto md:max-w-none md:z-auto",
        "transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        className
      )}
      role="region"
      aria-label="Кошик"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          Кошик
          {totalItems > 0 && (
            <Badge variant="secondary">{totalItems}</Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearCart}
              aria-label="Очистити кошик"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden"
              aria-label="Закрити кошик"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <EmptyState type="cart" />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItemRow
                key={item.menuItem.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3 pt-4 border-t">
        {/* Table number input */}
        <div className="w-full">
          <label
            htmlFor="table-number"
            className="text-sm font-medium text-muted-foreground mb-1 block"
          >
            Номер столу
          </label>
          <input
            id="table-number"
            type="number"
            min="1"
            max="99"
            value={tableInput}
            onChange={handleTableChange}
            placeholder="Введіть номер"
            className="w-full h-12 px-4 text-lg font-medium text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            aria-describedby="table-hint"
          />
          <span id="table-hint" className="sr-only">
            Введіть номер столу для замовлення
          </span>
        </div>

        {/* Total */}
        <div className="w-full flex items-center justify-between text-lg font-semibold">
          <span>Разом:</span>
          <span className="text-primary">{formatPrice(totalAmount)}</span>
        </div>

        {/* Confirm button */}
        <Button
          size="xl"
          className="w-full"
          disabled={!canConfirm}
          onClick={onConfirmOrder}
        >
          Підтвердити замовлення
        </Button>
      </CardFooter>
    </Card>
  );
}

// Cart item row component
interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { menuItem, quantity } = item;
  const itemTotal = menuItem.price * quantity;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{menuItem.name}</h4>
        <p className="text-sm text-muted-foreground">
          {formatPrice(menuItem.price)} x {quantity}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(menuItem.id, quantity - 1)}
          aria-label={`Зменшити кількість ${menuItem.name}`}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span
          className="w-8 text-center font-medium"
          aria-label={`Кількість: ${quantity}`}
        >
          {quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(menuItem.id, quantity + 1)}
          aria-label={`Збільшити кількість ${menuItem.name}`}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Item total */}
      <div className="text-right min-w-[70px]">
        <span className="font-semibold text-sm">{formatPrice(itemTotal)}</span>
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-danger"
        onClick={() => onRemove(menuItem.id)}
        aria-label={`Видалити ${menuItem.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
