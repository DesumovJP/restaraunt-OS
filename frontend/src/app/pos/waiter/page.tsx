"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TopNavbar } from "@/features/pos/top-navbar";
import { LeftSidebar } from "@/features/pos/left-sidebar";
import { SearchBar } from "@/features/pos/search-bar";
import { CategoryNavbar } from "@/features/pos/category-navbar";
import { MenuGrid } from "@/features/menu/menu-grid";
import { InvoiceSidebar } from "@/features/pos/invoice-sidebar";
import { OrderConfirmDialog } from "@/features/orders/order-confirm-dialog";
import { useCartStore } from "@/stores/cart-store";
import { useTableStore } from "@/stores/table-store";
import { ordersApi } from "@/lib/api";
import { useMenu } from "@/hooks/use-menu";
import type { Category, MenuItem } from "@/types";

export default function WaiterPOSPage() {
  const router = useRouter();

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

  // Redirect if no table selected
  React.useEffect(() => {
    if (!selectedTable) {
      router.push('/pos/waiter/tables');
    }
  }, [selectedTable, router]);

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

  if (!selectedTable) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar Navigation */}
      <LeftSidebar 
        open={isSidebarOpen} 
        onOpenChange={setIsSidebarOpen}
        userName="Courtney Henry"
        userRole="Cashier 1st Shift"
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar 
          userName="Courtney Henry" 
          userRole="Cashier 1st Shift"
          onMenuClick={() => setIsSidebarOpen(true)}
          tableNumber={selectedTable?.number}
          tableOccupiedAt={selectedTable?.occupiedAt}
        />

        {/* Content with Menu and Invoice Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side: Menu */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search Your Menu Here"
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
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
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
                  <p className="text-slate-600 font-medium">No items found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Try adjusting your filters or search query
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Right Side: Invoice Sidebar */}
          <InvoiceSidebar />
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
