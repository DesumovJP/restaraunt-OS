'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTableStore } from '@/stores/table-store';
import { TableGrid } from '@/features/tables/table-grid';
import { LeftSidebar } from '@/features/pos/left-sidebar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RotateCcw, AlertTriangle, Menu } from 'lucide-react';
import type { Table } from '@/types/table';

export default function TableSelectionPage() {
  const router = useRouter();
  const selectTable = useTableStore((state) => state.selectTable);
  const updateTableStatus = useTableStore((state) => state.updateTableStatus);
  const resetAllTables = useTableStore((state) => state.resetAllTables);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleTableSelect = (table: Table) => {
    // Select the table
    selectTable(table);

    // Якщо стіл вільний, позначаємо його як зайнятий
    // Якщо вже зайнятий або заброньований, просто вибираємо для обслуговування
    if (table.status === 'free') {
      updateTableStatus(table.id, 'occupied');
    }

    // Navigate to the POS screen
    router.push('/pos/waiter');
  };

  const handleResetAll = () => {
    resetAllTables();
    setShowResetDialog(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-navy-50 via-white to-accent-50">
      {/* Left Sidebar */}
      <LeftSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        userName="Офіціант"
        userRole="Зміна 1"
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Меню"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-navy-900">
                  Оберіть стіл
                </h1>
                <p className="text-slate-600 mt-1">
                  Виберіть стіл для обслуговування
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(true)}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Скинути всі столики</span>
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-4 bg-white/70 backdrop-blur-md rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-700">Вільний</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-700">Зайнятий</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-700">Заброньовано</span>
            </div>
          </div>

          {/* Table Grid */}
          <TableGrid onTableSelect={handleTableSelect} />
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Скинути всі столики?
            </DialogTitle>
            <DialogDescription>
              Ця дія скине всі столики до вільного стану та очистить всі таймери.
              Продовжити?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Скасувати
            </Button>
            <Button variant="destructive" onClick={handleResetAll}>
              Скинути
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
