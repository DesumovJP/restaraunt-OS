"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNavbar } from "@/features/pos/top-navbar";
import { LeftSidebar } from "@/features/pos/left-sidebar";
import { SearchBar } from "@/features/pos/search-bar";
import { CategoryNavbar } from "@/features/pos/category-navbar";
import { MenuGrid } from "@/features/menu/menu-grid";
import { InvoiceSidebar } from "@/features/pos/invoice-sidebar";
import { ScheduledModeBanner } from "@/features/pos/scheduled-mode-banner";
import { OrderConfirmDialog } from "@/features/orders/order-confirm-dialog";
import { useCartStore } from "@/stores/cart-store";
import { useTableStore } from "@/stores/table-store";
import { useScheduledOrderModeStore } from "@/stores/scheduled-order-mode-store";
import { ordersApi } from "@/lib/api";
import { useMenu } from "@/hooks/use-menu";
import { DailiesView } from "@/features/dailies";
import type { Category, MenuItem } from "@/types";

export type WaiterView = 'menu' | 'dailies';

export default function WaiterPOSPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cart store
  const {
    items: cartItems,
    tableNumber,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    setTableNumber,
    clearCart,
    getTotalItems,
    getTotalAmount,
  } = useCartStore();

  const selectedTable = useTableStore((state) => state.selectedTable);

  // Scheduled mode
  const isScheduledMode = useScheduledOrderModeStore((state) => state.isScheduledMode);
  const enterScheduledMode = useScheduledOrderModeStore((state) => state.enterScheduledMode);

  // Parse URL params for scheduled mode
  React.useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'scheduled') {
      const reservationId = searchParams.get('reservationId');
      const reservationCode = searchParams.get('reservationCode');
      const tableId = searchParams.get('tableId');
      const tableNum = searchParams.get('tableNumber');
      const scheduledFor = searchParams.get('scheduledFor');
      const contactName = searchParams.get('contactName');
      const contactPhone = searchParams.get('contactPhone');
      const guestCount = searchParams.get('guestCount');

      enterScheduledMode({
        reservationId,
        reservationCode,
        tableId,
        tableNumber: tableNum ? parseInt(tableNum, 10) : null,
        scheduledFor,
        contactName,
        contactPhone,
        guestCount: guestCount ? parseInt(guestCount, 10) : null,
      });
    }
  }, [searchParams, enterScheduledMode]);

  // Fetch menu from GraphQL
  const { categories: allCategories, menuItems: allMenuItems, isLoading } = useMenu();

  // Filter out internal categories (not for customer ordering)
  const HIDDEN_CATEGORY_SLUGS = ['semi-finished', 'sauces'];

  const categories = React.useMemo(() =>
    allCategories.filter((cat) => !HIDDEN_CATEGORY_SLUGS.includes(cat.slug || '')),
    [allCategories]
  );

  const menuItems = React.useMemo(() => {
    const hiddenCategoryIds = allCategories
      .filter((cat) => HIDDEN_CATEGORY_SLUGS.includes(cat.slug || ''))
      .map((cat) => cat.id);
    return allMenuItems.filter((item) => !hiddenCategoryIds.includes(item.categoryId));
  }, [allCategories, allMenuItems]);

  // Local state
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<WaiterView>('menu');

  // Redirect if no table selected (skip in scheduled mode)
  React.useEffect(() => {
    if (!selectedTable && !isScheduledMode) {
      router.push('/pos/waiter/tables');
    }
  }, [selectedTable, isScheduledMode, router]);

  // Filter menu items by category and search
  const filteredItems = React.useMemo(() => {
    let items = menuItems;

    // Filter by category
    if (selectedCategory) {
      items = items.filter((item) => item.categoryId === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  // Calculate menu item counts per category
  const menuItemCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((category) => {
      counts[category.id] = menuItems.filter(
        (item) => item.categoryId === category.id
      ).length;
    });
    return counts;
  }, [categories, menuItems]);

  // Handle order confirmation
  const handleConfirmOrder = async () => {
    const orderItems = cartItems.map((item) => ({
      id: `item-${Date.now()}-${item.menuItem.id}`,
      menuItemId: item.menuItem.id,
      menuItem: item.menuItem,
      quantity: item.quantity,
      notes: item.notes,
      status: "pending" as const,
    }));

    await ordersApi.createOrder({
      tableNumber: tableNumber!,
      items: orderItems,
      status: "pending",
      totalAmount: getTotalAmount(),
      waiterId: "waiter-1",
    });

    clearCart();
  };

  if (!selectedTable && !isScheduledMode) {
    return null;
  }

  // Table number to display (from selected table or scheduled mode)
  const displayTableNumber = isScheduledMode
    ? useScheduledOrderModeStore.getState().tableNumber
    : selectedTable?.number;
  const displayTableOccupiedAt = selectedTable?.occupiedAt;

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar Navigation */}
      <LeftSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        userName="Courtney Henry"
        userRole="Cashier 1st Shift"
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Scheduled Mode Banner */}
        <ScheduledModeBanner />

        {/* Top Navbar */}
        <TopNavbar
          onMenuClick={() => setIsSidebarOpen(true)}
          tableNumber={displayTableNumber || undefined}
          tableOccupiedAt={displayTableOccupiedAt}
        />

        {/* Content with Menu and Invoice Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {activeView === 'dailies' ? (
            /* Dailies View */
            <main className="flex-1 flex flex-col overflow-hidden">
              <DailiesView compact className="h-full" />
            </main>
          ) : (
            /* Menu View */
            <>
              <main className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="px-4 md:px-6 pt-4 pb-3">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Пошук страви..."
                  />
                </div>

                {/* Category Navbar */}
                <CategoryNavbar
                  categories={categories}
                  activeCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  menuItemCounts={menuItemCounts}
                />

                {/* Menu Grid */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                  <MenuGrid
                    items={filteredItems}
                    categories={categories}
                    cartItems={cartItems}
                    onAddItem={addItem}
                    isLoading={isLoading}
                  />

                  {/* Empty State */}
                  {!isLoading && filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-slate-500">Нічого не знайдено</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Спробуйте змінити фільтри або пошук
                      </p>
                    </div>
                  )}
                </div>
              </main>

              {/* Right Side: Invoice Sidebar */}
              <InvoiceSidebar />
            </>
          )}
        </div>
      </div>

      {/* Order confirmation dialog */}
      <OrderConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        items={cartItems}
        tableNumber={tableNumber}
        totalAmount={getTotalAmount()}
        onConfirm={handleConfirmOrder}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
