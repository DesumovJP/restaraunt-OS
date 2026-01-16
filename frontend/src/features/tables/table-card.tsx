'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Table } from '@/types/table';
import { Users, Clock, Calendar, MoreVertical, X, ArrowRightLeft, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ZONE_LABELS, ZONE_ICONS, ZONE_COLORS } from '@/lib/constants/tables';
import { CloseTableDialog } from './close-table-dialog';
import { ExtendSessionDialog } from './extend-session-dialog';
import { MergeTablesDialog } from './merge-tables-dialog';
import { useTableStore } from '@/stores/table-store';
import { toast } from 'sonner';

interface NextReservation {
  time: string;
  guestCount: number;
  contactName?: string;
}

interface TableCardProps {
  table: Table;
  onSelect: (table: Table) => void;
  nextReservation?: NextReservation;
}

// Компонент таймера - компактний з анімацією
function TableTimer({ occupiedAt }: { occupiedAt?: Date | string }) {
  const [elapsed, setElapsed] = React.useState<string>('');
  const [isLongSession, setIsLongSession] = React.useState(false);

  React.useEffect(() => {
    if (!occupiedAt) {
      setElapsed('');
      return;
    }

    const startDate = occupiedAt instanceof Date ? occupiedAt : new Date(occupiedAt);

    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();

      if (isNaN(diff) || diff < 0) {
        setElapsed('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setIsLongSession(hours >= 2);

      if (hours > 0) {
        setElapsed(`${hours}г ${minutes}хв`);
      } else {
        setElapsed(`${minutes}хв`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000);

    return () => clearInterval(interval);
  }, [occupiedAt]);

  if (!occupiedAt || !elapsed) return null;

  return (
    <span className={cn(
      "text-xs font-semibold tabular-nums transition-colors",
      isLongSession && "text-amber-700"
    )}>
      {elapsed}
    </span>
  );
}

// Конфіг статусів - преміальний вигляд з градієнтами
const statusConfig = {
  free: {
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/80 hover:border-emerald-400 hover:shadow-emerald-100',
    text: 'text-emerald-800',
    accent: 'text-emerald-600',
    indicator: 'bg-emerald-500',
    glow: 'shadow-emerald-500/10',
  },
  occupied: {
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/80 hover:border-amber-400 hover:shadow-amber-100',
    text: 'text-amber-800',
    accent: 'text-amber-600',
    indicator: 'bg-amber-500',
    glow: 'shadow-amber-500/10',
  },
  reserved: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/80 hover:border-blue-400 hover:shadow-blue-100',
    text: 'text-blue-800',
    accent: 'text-blue-600',
    indicator: 'bg-blue-500',
    glow: 'shadow-blue-500/10',
  },
};

export function TableCard({ table, onSelect, nextReservation }: TableCardProps) {
  const config = statusConfig[table.status];
  const tables = useTableStore((state) => state.tables);
  const closeTable = useTableStore((state) => state.closeTable);
  const extendTableSession = useTableStore((state) => state.extendTableSession);
  const mergeTables = useTableStore((state) => state.mergeTables);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = React.useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = React.useState(false);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const ZoneIcon = table.zone ? ZONE_ICONS[table.zone] : null;

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation(); // Prevent table selection

    switch (action) {
      case 'close':
        setIsCloseDialogOpen(true);
        break;
      case 'extend':
        setIsExtendDialogOpen(true);
        break;
      case 'move':
        toast.info('Функція переміщення гостей буде додана найближчим часом');
        break;
      case 'merge':
        setIsMergeDialogOpen(true);
        break;
    }
  };

  const handleCloseTable = async (reason: any, comment?: string) => {
    setIsClosing(true);
    try {
      await closeTable(table.documentId || table.id, reason, comment);
      toast.success(`Стіл №${table.number} закрито`);
      setIsCloseDialogOpen(false);
    } catch (error) {
      toast.error('Помилка при закритті столу');
      throw error;
    } finally {
      setIsClosing(false);
    }
  };

  const handleExtendSession = async (minutes: number) => {
    try {
      extendTableSession(table.documentId || table.id, minutes);
      toast.success(`Сесію столу №${table.number} подовжено`);
    } catch (error) {
      toast.error('Помилка при подовженні сесії');
      throw error;
    }
  };

  const handleMergeTables = async (tableIds: string[]) => {
    try {
      mergeTables(table.documentId || table.id, tableIds);
      toast.success(`Столи успішно об'єднано (${tableIds.length + 1} столів)`);
    } catch (error) {
      toast.error("Помилка при об'єднанні столів");
      throw error;
    }
  };

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col rounded-2xl border-2 overflow-hidden',
          'transition-all duration-200 ease-out',
          'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
          'h-[140px] sm:h-[150px]',
          'hover:shadow-lg hover:-translate-y-0.5',
          'touch-feedback',
          config.bg,
          config.glow
        )}
      >
        {/* Zone badge - top left (no circle indicator) */}
        {table.zone && ZoneIcon && (
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0.5 gap-1 bg-white/60 backdrop-blur-sm',
                ZONE_COLORS[table.zone]
              )}
            >
              <ZoneIcon className="h-3 w-3" />
              <span className="hidden sm:inline">{ZONE_LABELS[table.zone]}</span>
            </Badge>
          </div>
        )}

        {/* Quick Actions Menu - top right, shows on hover/touch */}
        {table.status === 'occupied' && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 sm:transition-opacity duration-200 sm:delay-75">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/70 backdrop-blur-sm rounded-lg"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'close')} className="text-red-600">
                  <X className="h-4 w-4 mr-2" />
                  Закрити стіл
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'extend')}>
                  <Clock className="h-4 w-4 mr-2" />
                  Подовжити сесію
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'move')}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Перемістити гостей
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleQuickAction(e, 'merge')}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Об'єднати столи
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Reservation indicator - animated badge */}
        {nextReservation && table.status === 'free' && (
          <div className="absolute top-2.5 right-2.5 bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full font-semibold shadow-md animate-fade-in">
            {nextReservation.time}
          </div>
        )}

        {/* Main card button - for selection */}
        <button
          onClick={() => onSelect(table)}
          className={cn(
            'w-full h-full flex flex-col items-center justify-center gap-1.5 py-6 px-3',
            'cursor-pointer',
            'focus:outline-none',
            'active:scale-[0.98] transition-transform duration-100'
          )}
        >
          {/* Номер столу - великий і чіткий з responsive розміром */}
          <span className={cn(
            'text-4xl sm:text-5xl font-bold tracking-tight leading-none',
            config.text
          )}>
            {table.number}
          </span>

          {/* Місця - покращений дизайн */}
          <div className={cn(
            'flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-white/50 backdrop-blur-sm',
            config.accent
          )}>
            <Users className="w-4 h-4" />
            <span>{table.capacity}</span>
          </div>

          {/* Таймер для зайнятих - покращений */}
          {table.status === 'occupied' && (
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/40 mt-1',
              config.accent
            )}>
              <Clock className="w-3.5 h-3.5" />
              <TableTimer occupiedAt={table.occupiedAt} />
            </div>
          )}

          {/* Наступне бронювання */}
          {nextReservation && table.status === 'free' && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span className="truncate max-w-[80px] font-medium">
                {nextReservation.contactName || `${nextReservation.guestCount} гостей`}
              </span>
            </div>
          )}

          {/* Reserved info */}
          {table.status === 'reserved' && table.reservedBy && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-full max-w-full">
              <span className="truncate font-medium">{table.reservedBy}</span>
            </div>
          )}

          {/* Current guests count for occupied tables */}
          {table.status === 'occupied' && table.currentGuests && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium mt-1',
              config.accent
            )}>
              <Users className="w-3 h-3" />
              <span>{table.currentGuests} {table.currentGuests === 1 ? 'гість' : 'гостей'}</span>
            </div>
          )}
        </button>
      </div>

      {/* Close Table Dialog */}
      <CloseTableDialog
        table={table}
        isOpen={isCloseDialogOpen}
        onClose={() => setIsCloseDialogOpen(false)}
        onConfirm={handleCloseTable}
      />

      {/* Extend Session Dialog */}
      <ExtendSessionDialog
        table={table}
        isOpen={isExtendDialogOpen}
        onClose={() => setIsExtendDialogOpen(false)}
        onConfirm={handleExtendSession}
      />

      {/* Merge Tables Dialog */}
      <MergeTablesDialog
        primaryTable={table}
        availableTables={tables}
        isOpen={isMergeDialogOpen}
        onClose={() => setIsMergeDialogOpen(false)}
        onConfirm={handleMergeTables}
      />
    </>
  );
}
