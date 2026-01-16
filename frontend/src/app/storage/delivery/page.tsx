"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Truck, Menu, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StorageLeftSidebar, type StorageView } from "@/features/storage/storage-left-sidebar";
import { DeliveryOrderForm } from "@/features/storage/components/delivery-order-form";

export default function DeliveryPage() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen-safe bg-background overflow-hidden">
      {/* Sidebar */}
      <StorageLeftSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        activeView={"delivery" as StorageView}
        onViewChange={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10 rounded-xl"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-emerald-600" />
                  Замовлення на поставку
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Створіть замовлення та надішліть постачальнику
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="max-w-4xl mx-auto">
            <DeliveryOrderForm />
          </div>
        </main>
      </div>
    </div>
  );
}
