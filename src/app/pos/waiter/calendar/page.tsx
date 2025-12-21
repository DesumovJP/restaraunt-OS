"use client";

import * as React from "react";
import { LeftSidebar } from "@/features/pos/left-sidebar";
import { TopNavbar } from "@/features/pos/top-navbar";
import { PlannedOrdersView } from "@/features/orders/planned-orders-view";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function WaiterCalendarPage() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Меню"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Заплановані замовлення</h1>
          </div>
        </div>

        {/* Content */}
        <PlannedOrdersView variant="waiter" className="flex-1" />
      </div>
    </div>
  );
}
