'use client';

import * as React from 'react';
import { useCartStore } from '@/stores/cart-store';
import { useTableStore } from '@/stores/table-store';
import { useScheduledOrderModeStore } from '@/stores/scheduled-order-mode-store';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  X,
  MessageSquare,
  ChefHat,
  Calendar,
  Receipt,
  ListPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { CommentEditor, CommentDisplay } from '@/features/orders/comment-editor';
import { OrderConfirmDialog } from '@/features/orders/order-confirm-dialog';
import { ScheduledOrderSaveDialog } from '@/features/orders/scheduled-order-save-dialog';
import { AddItemsToOrderDialog } from '@/features/orders/add-items-to-order-dialog';
import { CheckoutDialog } from '@/features/pos/checkout-dialog';
import { useOrdersStore } from '@/stores/orders-store';
import type { ItemComment } from '@/types/extended';
import { COMMENT_PRESETS } from '@/types/extended';

// Helper function to generate comment preview text
function getCommentPreview(comment: ItemComment | null): string {
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
    const truncatedText = comment.text.length > 20
      ? comment.text.slice(0, 20) + '...'
      : comment.text;
    parts.push(truncatedText);
  }

  return parts.join(' • ') || 'Коментар';
}

interface InvoiceSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show desktop sidebar (default: true). Set to false to only show mobile drawer/FAB */
  showDesktopSidebar?: boolean;
}

export function InvoiceSidebar({ open, onOpenChange, showDesktopSidebar = true }: InvoiceSidebarProps = {}) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTotalAmount = useCartStore((state) => state.getTotalAmount);
  const selectedTable = useTableStore((state) => state.selectedTable);

  // Scheduled mode
  const isScheduledMode = useScheduledOrderModeStore((state) => state.isScheduledMode);
  const scheduledTableNumber = useScheduledOrderModeStore((state) => state.tableNumber);

  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isOrderConfirmOpen, setIsOrderConfirmOpen] = React.useState(false);
  const [isScheduledSaveOpen, setIsScheduledSaveOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isAddItemsOpen, setIsAddItemsOpen] = React.useState(false);

  // Check for active orders
  const getOrdersForTable = useOrdersStore((state) => state.getOrdersForTable);
  const hasActiveOrders = React.useMemo(() => {
    if (!selectedTable) return false;
    const orders = getOrdersForTable(selectedTable.number);
    return orders.some(
      (order) =>
        order.status !== 'served' &&
        order.status !== 'cancelled'
    );
  }, [selectedTable, getOrdersForTable]);

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
    if (items.length === 0) return;

    if (isScheduledMode) {
      // In scheduled mode, open the scheduled save dialog
      setIsScheduledSaveOpen(true);
    } else {
      // Normal mode - need table selected
      if (!selectedTable) return;
      setIsOrderConfirmOpen(true);
    }
  };

  const handleOrderSuccess = () => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
    // Stay on POS page to continue adding orders for the same table
    // Don't navigate away - user might want to add more items
  };

  const handleOpenChange = (newOpen: boolean) => {
    setIsMobileOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const InvoiceContent = () => (
    <>
      {/* Header - Premium design */}
      <div className="px-4 py-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Замовлення</h2>
          {items.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {items.reduce((sum, item) => sum + item.quantity, 0)} позицій
            </p>
          )}
        </div>
        {isMobile && (
          <button
            onClick={() => handleOpenChange(false)}
            className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors touch-feedback"
            aria-label="Закрити"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Cart Items - Premium design */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-700 font-medium">Кошик порожній</p>
            <p className="text-slate-500 text-sm mt-1">Додайте страви з меню</p>
          </div>
        ) : (
          items.map((item, index) => {
            const menuItemKey = item.menuItem.documentId || item.menuItem.id;
            const comment = itemComments[menuItemKey];

            return (
              <div
                key={menuItemKey}
                className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 shadow-sm animate-fade-in-up hover-lift transition-all"
                style={{
                  animationDelay: `${index * 30}ms`,
                  animationFillMode: 'both',
                }}
              >
                {/* Верхній рядок: назва + кількість + видалити */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {item.menuItem.name}
                      </h3>
                      {item.menuItem.weight && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {item.menuItem.weight}{item.menuItem.outputType === 'bar' ? 'мл' : 'г'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {formatPrice(item.menuItem.price * item.quantity)}
                    </span>
                  </div>

                  {/* Кількість */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(menuItemKey, item.quantity - 1)}
                      className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors touch-feedback"
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="w-8 text-center font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(menuItemKey, item.quantity + 1)}
                      className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors touch-feedback"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>

                  {/* Видалити */}
                  <button
                    onClick={() => removeItem(menuItemKey)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors touch-feedback"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Коментар */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                  <button
                    onClick={() => setEditingCommentId(menuItemKey)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-lg max-w-full transition-colors touch-feedback",
                      comment
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "text-slate-500 hover:bg-slate-100 border border-transparent"
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate font-medium">
                      {comment ? getCommentPreview(comment) : "Додати коментар"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary & Send to Kitchen - Premium design */}
      <div className="px-4 py-4 border-t border-slate-200/80 space-y-3 bg-gradient-to-t from-slate-50 to-white">
        {/* Сума */}
        <div className="flex justify-between items-center p-3 bg-slate-100/80 rounded-xl">
          <span className="text-slate-600 font-medium">Всього</span>
          <span className="text-2xl font-bold text-slate-900">
            {formatPrice(total)}
          </span>
        </div>

        {/* Send to Kitchen / Save Scheduled Button */}
        {isScheduledMode ? (
          <Button
            onClick={handlePlaceOrder}
            disabled={items.length === 0}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all touch-feedback flex-shrink-0"
            size="lg"
          >
            <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="truncate">Зберегти замовлення</span>
            {scheduledTableNumber && <span className="ml-1 opacity-75 flex-shrink-0">• Стіл {scheduledTableNumber}</span>}
          </Button>
        ) : (
          <>
            <Button
              onClick={handlePlaceOrder}
              disabled={items.length === 0 || !selectedTable}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all touch-feedback disabled:opacity-50 disabled:shadow-none flex-shrink-0"
              size="lg"
            >
              <ChefHat className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>На кухню</span>
              {selectedTable && <span className="ml-1 opacity-75 flex-shrink-0">• Стіл {selectedTable.number}</span>}
            </Button>

            {/* Add to existing order button - only when table has active orders */}
            {selectedTable && hasActiveOrders && items.length > 0 && (
              <Button
                onClick={() => setIsAddItemsOpen(true)}
                variant="outline"
                className="w-full h-12 text-base font-semibold border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all touch-feedback flex-shrink-0"
                size="lg"
              >
                <ListPlus className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Додати до замовлення</span>
              </Button>
            )}

            {/* Checkout button - only when table is selected */}
            {selectedTable && (
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                variant="outline"
                className="w-full h-12 text-base font-semibold border-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-all touch-feedback flex-shrink-0"
                size="lg"
              >
                <Receipt className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>Розрахувати</span>
              </Button>
            )}
          </>
        )}
      </div>

      {/* Comment Editor Modal */}
      {editingCommentId && (
        <CommentEditor
          value={itemComments[editingCommentId] || null}
          onChange={handleCommentSave}
          menuItemName={items.find((i) => (i.menuItem.documentId || i.menuItem.id) === editingCommentId)?.menuItem.name || ''}
          isOpen={!!editingCommentId}
          onClose={() => setEditingCommentId(null)}
        />
      )}
    </>
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Desktop Sidebar - Premium design (only show when showDesktopSidebar is true) */}
      {showDesktopSidebar && (
        <aside className="hidden lg:flex w-96 bg-white border-l border-slate-200/80 flex-col h-full shadow-sm">
          <InvoiceContent />
        </aside>
      )}

      {/* Mobile Drawer - responsive width */}
      <Drawer open={isMobileOpen} onOpenChange={handleOpenChange}>
        <DrawerContent side="right" className="flex flex-col h-full p-0 w-full sm:w-96 sm:max-w-[400px]">
          <div className="flex flex-col h-full safe-area-inset-bottom">
            <InvoiceContent />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile Floating Button - Premium design with safe area */}
      {isMobile && (
        <button
          onClick={() => handleOpenChange(true)}
          className={cn(
            "fixed lg:hidden z-40 fab",
            "w-16 h-16 rounded-2xl",
            "bg-gradient-to-br from-slate-800 to-slate-900",
            "text-white shadow-xl shadow-slate-900/30",
            "flex items-center justify-center",
            "border border-slate-700/50"
          )}
          style={{
            bottom: 'max(env(safe-area-inset-bottom, 0px) + 16px, 24px)',
            right: '24px',
          }}
          aria-label="Відкрити кошик"
        >
          <ShoppingCart className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[28px] h-7 px-2 rounded-full bg-emerald-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce-in">
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

      {/* Scheduled Order Save Dialog */}
      <ScheduledOrderSaveDialog
        open={isScheduledSaveOpen}
        onOpenChange={setIsScheduledSaveOpen}
        itemComments={itemComments}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        tableDocumentId={selectedTable?.documentId || null}
        tableNumber={selectedTable?.number || null}
        onSuccess={() => {
          // Update table status to free and clear selected table
          const tableKey = selectedTable?.documentId || selectedTable?.id;
          if (tableKey) {
            useTableStore.getState().updateTableStatus(tableKey, 'free');
          }
          useTableStore.getState().clearSelectedTable();
          // Navigate to tables view after successful checkout
          router.push('/pos/waiter/tables');
        }}
      />

      {/* Add Items to Order Dialog */}
      {selectedTable && (
        <AddItemsToOrderDialog
          tableNumber={selectedTable.number}
          isOpen={isAddItemsOpen}
          onClose={() => setIsAddItemsOpen(false)}
          onSuccess={() => {
            if (isMobile) {
              setIsMobileOpen(false);
            }
          }}
          itemComments={itemComments}
        />
      )}
    </>
  );
}
