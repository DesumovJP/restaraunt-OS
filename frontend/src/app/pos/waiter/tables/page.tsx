'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTableStore } from '@/stores/table-store';
import { useSyncTables } from '@/hooks/use-sync-tables';
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
import { RotateCcw, AlertTriangle, Menu, CalendarPlus } from 'lucide-react';
import type { Table } from '@/types/table';
import { ReservationDialog } from '@/features/reservations';

export default function TableSelectionPage() {
  const router = useRouter();
  const selectTable = useTableStore((state) => state.selectTable);
  const updateTableStatus = useTableStore((state) => state.updateTableStatus);
  const resetAllTables = useTableStore((state) => state.resetAllTables);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = React.useState(false);

  // Sync tables from Strapi to get documentId for GraphQL mutations
  useSyncTables();

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
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar */}
      <LeftSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        userName="Офіціант"
        userRole="Зміна 1"
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header - компактний */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-11 w-11"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Меню"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-900">
                Оберіть стіл
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReservationDialogOpen(true)}
                className="gap-1.5"
              >
                <CalendarPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Бронювання</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowResetDialog(true)}
                className="h-11 w-11 text-slate-500"
                title="Скинути всі столики"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Table Grid - без легенди, колір карток говорить сам за себе */}
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

      {/* Reservation Dialog */}
      <ReservationDialog
        open={isReservationDialogOpen}
        onOpenChange={setIsReservationDialogOpen}
      />
    </div>
  );
}
