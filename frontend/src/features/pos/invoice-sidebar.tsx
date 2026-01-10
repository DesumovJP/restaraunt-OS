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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { CommentEditor, CommentDisplay } from '@/features/orders/comment-editor';
import { OrderConfirmDialog } from '@/features/orders/order-confirm-dialog';
import { ScheduledOrderSaveDialog } from '@/features/orders/scheduled-order-save-dialog';
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
}

export function InvoiceSidebar({ open, onOpenChange }: InvoiceSidebarProps = {}) {
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
    // Stay on POS page to continue adding orders or go to tables
    router.push('/pos/waiter/tables');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setIsMobileOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const InvoiceContent = () => (
    <>
      {/* Header - компактний */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Замовлення</h2>
        {isMobile && (
          <button
            onClick={() => handleOpenChange(false)}
            className="w-11 h-11 rounded-lg flex items-center justify-center hover:bg-slate-100"
            aria-label="Закрити"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Cart Items - спрощений вигляд */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm">Кошик порожній</p>
          </div>
        ) : (
          items.map((item) => {
            const comment = itemComments[item.menuItem.id];

            return (
              <div
                key={item.menuItem.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100"
              >
                {/* Верхній рядок: назва + кількість + видалити */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 text-sm truncate">
                        {item.menuItem.name}
                      </h3>
                      {item.menuItem.weight && (
                        <span className="text-xs text-slate-400 shrink-0">
                          {item.menuItem.weight}{item.menuItem.outputType === 'bar' ? 'мл' : 'г'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-slate-600">
                      {formatPrice(item.menuItem.price * item.quantity)}
                    </span>
                  </div>

                  {/* Кількість */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                      className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                      className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Видалити */}
                  <button
                    onClick={() => removeItem(item.menuItem.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Коментар */}
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setEditingCommentId(item.menuItem.id)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md max-w-full",
                      comment
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {comment ? getCommentPreview(comment) : "Додати коментар"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary & Send to Kitchen - компактний */}
      <div className="px-4 py-4 border-t border-slate-200 space-y-3 bg-white">
        {/* Сума */}
        <div className="flex justify-between items-center">
          <span className="text-slate-600">
            {items.reduce((sum, item) => sum + item.quantity, 0)} позицій
          </span>
          <span className="text-xl font-bold text-slate-900">
            {formatPrice(total)}
          </span>
        </div>

        {/* Send to Kitchen / Save Scheduled Button */}
        {isScheduledMode ? (
          <Button
            onClick={handlePlaceOrder}
            disabled={items.length === 0}
            className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Зберегти замовлення
            {scheduledTableNumber && <span className="ml-1 opacity-75">• Стіл {scheduledTableNumber}</span>}
          </Button>
        ) : (
          <Button
            onClick={handlePlaceOrder}
            disabled={items.length === 0 || !selectedTable}
            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            size="lg"
          >
            <ChefHat className="w-5 h-5 mr-2" />
            На кухню
            {selectedTable && <span className="ml-1 opacity-75">• Стіл {selectedTable.number}</span>}
          </Button>
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

      {/* Scheduled Order Save Dialog */}
      <ScheduledOrderSaveDialog
        open={isScheduledSaveOpen}
        onOpenChange={setIsScheduledSaveOpen}
        itemComments={itemComments}
      />
    </>
  );
}
