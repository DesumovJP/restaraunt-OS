'use client';

import * as React from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useTableStore } from '@/stores/table-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  X,
  MessageSquare,
  ChefHat,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { CommentEditor, CommentDisplay } from '@/features/orders/comment-editor';
import { OrderConfirmDialog } from '@/features/orders/order-confirm-dialog';
import type { ItemComment } from '@/types/extended';

interface InvoiceSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function InvoiceSidebar({ open, onOpenChange }: InvoiceSidebarProps = {}) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTotalAmount = useCartStore((state) => state.getTotalAmount);
  const selectedTable = useTableStore((state) => state.selectedTable);

  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isOrderConfirmOpen, setIsOrderConfirmOpen] = React.useState(false);

  // Comment state for each item
  const [itemComments, setItemComments] = React.useState<Record<string, ItemComment | null>>({});
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);

  const handleCommentSave = (comment: ItemComment | null) => {
    if (editingCommentId) {
      setItemComments((prev) => ({ ...prev, [editingCommentId]: comment }));
      setEditingCommentId(null);
    }
  };

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsMobileOpen(open);
    }
  }, [open]);

  const subtotal = getSubtotal();
  const total = getTotalAmount();

  const handlePlaceOrder = () => {
    if (items.length === 0 || !selectedTable) return;
    setIsOrderConfirmOpen(true);
  };

  const handleOrderSuccess = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
    // Stay on POS page to continue adding orders or go to tables
    router.push('/pos/waiter/tables');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setIsMobileOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const InvoiceContent = () => (
    <>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Invoice</h2>
          {isMobile && (
            <button
              onClick={() => handleOpenChange(false)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Your cart is empty</p>
            <p className="text-sm text-slate-500 mt-1">
              Add items from the menu
            </p>
          </div>
        ) : (
          items.map((item) => {
            const comment = itemComments[item.menuItem.id];

            return (
              <div
                key={item.menuItem.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50"
              >
                {/* Header with name and quantity controls */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {item.menuItem.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {formatPrice(item.menuItem.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 text-slate-400 hover:text-red-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comment button */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setEditingCommentId(item.menuItem.id)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                      comment ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <MessageSquare className="w-3 h-3" />
                    {comment ? "Коментар" : "Додати"}
                  </button>
                </div>

                {/* Comment display */}
                {comment && (
                  <div className="mt-2">
                    <CommentDisplay comment={comment} size="sm" maxPresets={2} />
                  </div>
                )}

                {/* Item total */}
                <div className="flex justify-end mt-2 pt-2 border-t border-slate-200">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(item.menuItem.price * item.quantity)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary & Send to Kitchen */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-slate-200 space-y-4 bg-white">
        {/* Order Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Позицій</span>
            <span className="font-semibold text-slate-900">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <div className="h-px bg-slate-200 my-2" />
          <div className="flex justify-between text-base">
            <span className="font-bold text-slate-900">Сума</span>
            <span className="font-bold text-slate-900">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* Table info */}
        {selectedTable && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 rounded-lg">
            <Badge variant="outline" className="text-sm">
              Стіл {selectedTable.number}
            </Badge>
          </div>
        )}

        {/* Send to Kitchen Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={items.length === 0 || !selectedTable}
          className="w-full h-14 text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white"
          size="lg"
        >
          <ChefHat className="w-5 h-5 mr-2" />
          Відправити на кухню
        </Button>

        {!selectedTable && items.length > 0 && (
          <p className="text-xs text-center text-amber-600">
            Оберіть стіл для оформлення замовлення
          </p>
        )}
      </div>

      {/* Comment Editor Modal */}
      {editingCommentId && (
        <CommentEditor
          value={itemComments[editingCommentId] || null}
          onChange={handleCommentSave}
          menuItemName={items.find((i) => i.menuItem.id === editingCommentId)?.menuItem.name || ''}
          isOpen={!!editingCommentId}
          onClose={() => setEditingCommentId(null)}
        />
      )}
    </>
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-96 bg-white border-l border-slate-200 flex-col h-full">
        <InvoiceContent />
      </aside>

      {/* Mobile Drawer */}
      <Drawer open={isMobileOpen} onOpenChange={handleOpenChange}>
        <DrawerContent side="right" className="flex flex-col h-full p-0">
          <div className="flex flex-col h-full">
            <InvoiceContent />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile Floating Button */}
      {isMobile && (
        <button
          onClick={() => handleOpenChange(true)}
          className="fixed bottom-6 right-6 lg:hidden z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Open invoice"
        >
          <ShoppingCart className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      )}

      {/* Order Confirm Dialog */}
      <OrderConfirmDialog
        open={isOrderConfirmOpen}
        onOpenChange={setIsOrderConfirmOpen}
        onSuccess={handleOrderSuccess}
        itemComments={itemComments}
      />
    </>
  );
}
