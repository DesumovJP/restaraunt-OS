"use client";

import * as React from "react";
import { Suspense } from "react";
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
import { WorkersChat } from "@/features/admin/workers-chat";
import { ShiftScheduleView } from "@/features/schedule";
import { WorkerProfileCard, type WorkerProfileData } from "@/features/profile";
import { useAuthStore } from "@/stores/auth-store";
import type { Category, MenuItem } from "@/types";

export type WaiterView = 'tables' | 'menu' | 'calendar' | 'dailies' | 'chat' | 'schedule' | 'profile';

// Premium loading skeleton
function LoadingState() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Wrapper component to handle Suspense for useSearchParams
export default function WaiterPOSPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <WaiterPOSContent />
    </Suspense>
  );
}

function WaiterPOSContent() {
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

  // Read initial view from URL params
  const viewFromUrl = searchParams.get('view') as WaiterView | null;
  const [activeView, setActiveView] = React.useState<WaiterView>(viewFromUrl || 'menu');

  // Update active view when URL params change
  React.useEffect(() => {
    const view = searchParams.get('view') as WaiterView | null;
    if (view && ['dailies', 'chat', 'schedule', 'profile'].includes(view)) {
      setActiveView(view);
    }
  }, [searchParams]);

  // Redirect if no table selected (skip in scheduled mode and non-menu views)
  React.useEffect(() => {
    // Allow access to dailies, chat, schedule, profile views without table
    const viewsWithoutTable = ['dailies', 'chat', 'schedule', 'profile'];
    if (!selectedTable && !isScheduledMode && !viewsWithoutTable.includes(activeView)) {
      router.push('/pos/waiter/tables');
    }
  }, [selectedTable, isScheduledMode, activeView, router]);

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

  // Allow access to certain views without table
  const viewsWithoutTable = ['dailies', 'chat', 'schedule', 'profile'];
  if (!selectedTable && !isScheduledMode && !viewsWithoutTable.includes(activeView)) {
    return null;
  }

  // Table number to display (from selected table or scheduled mode)
  const displayTableNumber = isScheduledMode
    ? useScheduledOrderModeStore.getState().tableNumber
    : selectedTable?.number;
  const displayTableOccupiedAt = selectedTable?.occupiedAt;

  return (
    <div className="flex h-screen-safe bg-slate-50">
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
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
              <DailiesView compact className="h-full" variant="waiter" />
            </main>
          ) : activeView === 'chat' ? (
            /* Chat View */
            <main className="flex-1 flex flex-col overflow-hidden p-4 bg-white">
              <WorkersChat />
            </main>
          ) : activeView === 'schedule' ? (
            /* Schedule View - Read Only */
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
              <ShiftScheduleView compact className="h-full" />
            </main>
          ) : activeView === 'profile' ? (
            /* Profile View */
            <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 bg-slate-50">
              <div className="max-w-md mx-auto w-full animate-fade-in-up">
                <WorkerProfileCard
                  worker={{
                    documentId: 'waiter-1',
                    name: 'Courtney Henry',
                    role: 'waiter',
                    department: 'service',
                    status: 'active',
                    phone: '+380 67 123 4567',
                    email: 'courtney@restaurant.com',
                    hoursThisWeek: 32,
                    hoursThisMonth: 128,
                    shiftsThisWeek: 4,
                    shiftsThisMonth: 16,
                    rating: 4.8,
                    ordersServed: 156,
                    avgTicketTime: 12,
                  }}
                  variant="full"
                  onViewSchedule={() => setActiveView('schedule')}
                  onLogout={() => router.push('/')}
                />
              </div>
            </main>
          ) : (
            /* Menu View */
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
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
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 bg-slate-50/50">
                <MenuGrid
                  items={filteredItems}
                  categories={categories}
                  cartItems={cartItems}
                  onAddItem={addItem}
                  isLoading={isLoading}
                />

                {/* Empty State - Premium design */}
                {!isLoading && filteredItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-slate-700">Нічого не знайдено</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Спробуйте змінити фільтри або пошук
                    </p>
                  </div>
                )}
              </div>
            </main>
          )}

          {/* Right Side: Invoice Sidebar - Desktop only in menu view, mobile always */}
          <InvoiceSidebar showDesktopSidebar={activeView === 'menu'} />
        </div>
      </div>

      {/* Order confirmation dialog */}
      <OrderConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onSuccess={handleConfirmOrder}
      />
    </div>
  );
}
