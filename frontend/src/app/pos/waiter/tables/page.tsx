'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTableStore, type TableStore } from '@/stores/table-store';
import { useSyncTables } from '@/hooks/use-sync-tables';
import { useUpdateTableStatus } from '@/hooks/use-graphql-orders';
import { TableGrid } from '@/features/tables/table-grid';
import { LeftSidebar } from '@/features/pos/left-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RotateCcw,
  AlertTriangle,
  Menu,
  CalendarPlus,
  Loader2,
  Search,
  Clock,
  Calendar,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Table, TableZone } from '@/types/table';
import { ZONE_LABELS, ZONE_LABELS_SHORT, ZONE_ICONS } from '@/lib/constants/tables';
import { ReservationDialog } from '@/features/reservations';

export default function TableSelectionPage() {
  const router = useRouter();
  const tables = useTableStore((s: TableStore) => s.tables);
  const selectTable = useTableStore((s: TableStore) => s.selectTable);
  const updateLocalTableStatus = useTableStore((s: TableStore) => s.updateTableStatus);
  const resetAllTables = useTableStore((s: TableStore) => s.resetAllTables);
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Filters and search
  const [selectedZone, setSelectedZone] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Sync tables from Strapi - source of truth for all workers
  const { refetch } = useSyncTables();

  // GraphQL mutation to update table status in Strapi
  const { updateTableStatus: updateStrapiTableStatus } = useUpdateTableStatus();

  // Filter tables by zone, status, and search
  const filteredTables = React.useMemo(() => {
    return tables.filter((table: Table) => {
      // Zone filter
      if (selectedZone !== 'all' && table.zone !== selectedZone) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && table.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return table.number.toString().includes(query);
      }

      return true;
    });
  }, [tables, selectedZone, statusFilter, searchQuery]);

  // Statistics
  const stats = React.useMemo(() => {
    return {
      total: tables.length,
      free: tables.filter((t: Table) => t.status === 'free').length,
      occupied: tables.filter((t: Table) => t.status === 'occupied').length,
      reserved: tables.filter((t: Table) => t.status === 'reserved').length,
    };
  }, [tables]);

  // Zone counts
  const zoneCounts = React.useMemo(() => {
    const zones = ['main', 'terrace', 'vip', 'bar'] as TableZone[];
    return zones.reduce((acc, zone) => {
      acc[zone] = tables.filter((t: Table) => t.zone === zone).length;
      return acc;
    }, {} as Record<TableZone, number>);
  }, [tables]);

  const handleTableSelect = async (table: Table) => {
    // Якщо стіл вільний, спочатку оновлюємо статус в Strapi
    if (table.status === 'free' && table.documentId) {
      setIsUpdating(true);
      try {
        await updateStrapiTableStatus(table.documentId, 'occupied');
        // Оновлюємо локальний стан після успіху в Strapi
        updateLocalTableStatus(table.id, 'occupied');
        console.log('[Tables] Table status updated in Strapi:', table.number);
      } catch (error) {
        console.error('[Tables] Failed to update table status:', error);
        // Продовжуємо навіть при помилці, щоб не блокувати роботу
      } finally {
        setIsUpdating(false);
      }
    }

    // Select the table for current session
    selectTable({
      ...table,
      status: table.status === 'free' ? 'occupied' : table.status,
      occupiedAt: table.status === 'free' ? new Date() : table.occupiedAt,
    });

    // Navigate to the POS screen
    router.push('/pos/waiter');
  };

  const handleResetAll = () => {
    resetAllTables();
    setShowResetDialog(false);
  };

  return (
    <div className="flex h-screen-safe bg-slate-100">
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            <p className="text-sm font-medium text-slate-700">Оновлення статусу...</p>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <LeftSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        userName="Офіціант"
        userRole="Зміна 1"
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-11 w-11"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Меню"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Оберіть стіл
                  </h1>
                  <p className="text-sm text-slate-500 hidden sm:block">
                    Керування столами ресторану
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReservationDialogOpen(true)}
                  className="gap-1.5 h-10"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Бронювання</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResetDialog(true)}
                  className="h-10 w-10 text-slate-500"
                  title="Скинути всі столики"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-4">
          {/* Filter Row: Zone + Status + Search */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            {/* Zone Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => setSelectedZone('all')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-sm transition-all touch-feedback whitespace-nowrap',
                  selectedZone === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                )}
              >
                <span>Всі</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-xs font-semibold',
                  selectedZone === 'all' ? 'bg-white/20' : 'bg-slate-100'
                )}>
                  {tables.length}
                </span>
              </button>

              {(['main', 'terrace', 'vip', 'bar'] as TableZone[]).map((zone) => {
                const Icon = ZONE_ICONS[zone];
                const isActive = selectedZone === zone;
                return (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-sm transition-all touch-feedback whitespace-nowrap',
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{ZONE_LABELS_SHORT[zone]}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-semibold',
                      isActive ? 'bg-white/20' : 'bg-slate-100'
                    )}>
                      {zoneCounts[zone]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Separator on desktop */}
            <div className="hidden lg:block w-px h-6 bg-slate-200" />

            {/* Status Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all touch-feedback whitespace-nowrap',
                  statusFilter === 'all'
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                )}
              >
                Всі
              </button>
              <button
                onClick={() => setStatusFilter('free')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all touch-feedback whitespace-nowrap',
                  statusFilter === 'free'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                <span>Вільні</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-xs font-semibold',
                  statusFilter === 'free' ? 'bg-emerald-200/50' : 'bg-slate-100'
                )}>
                  {stats.free}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('occupied')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all touch-feedback whitespace-nowrap',
                  statusFilter === 'occupied'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                <span>Зайняті</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-xs font-semibold',
                  statusFilter === 'occupied' ? 'bg-amber-200/50' : 'bg-slate-100'
                )}>
                  {stats.occupied}
                </span>
              </button>
              <button
                onClick={() => setStatusFilter('reserved')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all touch-feedback whitespace-nowrap',
                  statusFilter === 'reserved'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                <span>Бронь</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-xs font-semibold',
                  statusFilter === 'reserved' ? 'bg-blue-200/50' : 'bg-slate-100'
                )}>
                  {stats.reserved}
                </span>
              </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Compact Search */}
            <div className="relative w-full lg:w-32">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="№ столу"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm rounded-lg border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-slate-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded transition-colors touch-feedback"
                >
                  <RotateCcw className="h-3 w-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Table Grid - the main focus */}
          <TableGrid tables={filteredTables} onTableSelect={handleTableSelect} />
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
          <DialogFooter className="border-t pt-4">
            <Button
              variant="destructive"
              onClick={handleResetAll}
              className="w-full h-11 text-base font-medium rounded-xl"
            >
              Скинути всі столики
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
