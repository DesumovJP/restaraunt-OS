'use client';

import * as React from 'react';
import {
  Menu,
  Timer,
  Receipt,
  ArrowRightLeft,
  MoreHorizontal,
  Users,
  StickyNote,
  LogOut,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActiveTable {
  id: string;
  number: number;
  occupiedAt?: Date | string;
  guestCount?: number;
}

interface TopNavbarProps {
  onMenuClick?: () => void;
  tableNumber?: number;
  tableOccupiedAt?: Date | string;
  // Multi-table support
  activeTables?: ActiveTable[];
  onTableSwitch?: (tableId: string) => void;
  // Table actions
  onRequestCheck?: () => void;
  onTransferTable?: () => void;
  onAddNote?: () => void;
  onCloseTable?: () => void;
}

// Компонент таймера - видимий і оновлюється частіше
function TableTimer({ occupiedAt }: { occupiedAt?: Date | string }) {
  const [elapsed, setElapsed] = React.useState<string>('00:00');
  const [isValid, setIsValid] = React.useState(false);
  const [isLongSession, setIsLongSession] = React.useState(false);

  React.useEffect(() => {
    if (!occupiedAt) {
      setIsValid(false);
      return;
    }

    const startDate = occupiedAt instanceof Date ? occupiedAt : new Date(occupiedAt);

    if (isNaN(startDate.getTime())) {
      setIsValid(false);
      return;
    }

    setIsValid(true);

    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();

      if (diff < 0) {
        setElapsed('00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Mark as long session if over 90 minutes
      setIsLongSession(hours > 0 || minutes > 90);

      if (hours > 0) {
        // Show hours:minutes for long sessions
        setElapsed(`${hours}:${minutes.toString().padStart(2, '0')}`);
      } else {
        // Show minutes:seconds for first hour
        setElapsed(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    // Update every second for accurate display
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [occupiedAt]);

  if (!isValid) return null;

  return (
    <span className={cn(
      "flex items-center gap-1.5 text-sm font-semibold tabular-nums transition-colors",
      isLongSession ? "text-red-600" : "text-amber-600"
    )}>
      <Timer className={cn("w-4 h-4", isLongSession && "animate-pulse")} />
      {elapsed}
    </span>
  );
}

export function TopNavbar({
  onMenuClick,
  tableNumber,
  tableOccupiedAt,
  activeTables = [],
  onTableSwitch,
  onRequestCheck,
  onTransferTable,
  onAddNote,
  onCloseTable,
}: TopNavbarProps) {
  const hasMultipleTables = activeTables.length > 1;
  const hasTableActions = onRequestCheck || onTransferTable || onAddNote || onCloseTable;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="px-4 md:px-6">
        <div className="flex items-center justify-between h-14 gap-2">
          {/* Left: Menu button (mobile) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors touch-feedback shrink-0"
            aria-label="Меню"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Center: Table info with switcher */}
          {tableNumber && (
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center sm:justify-start">
              {/* Table Badge - with dropdown if multiple tables */}
              {hasMultipleTables && onTableSwitch ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-slate-900">
                          Стіл {tableNumber}
                        </span>
                      </div>
                      <div className="w-px h-5 bg-slate-200 hidden sm:block" />
                      <TableTimer occupiedAt={tableOccupiedAt} />
                      <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Мої столи ({activeTables.length})
                    </div>
                    <DropdownMenuSeparator />
                    {activeTables.map((table) => (
                      <DropdownMenuItem
                        key={table.id}
                        onClick={() => onTableSwitch(table.id)}
                        className="gap-3"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            table.number === tableNumber ? "bg-emerald-500" : "bg-amber-500"
                          )} />
                          <span className="font-medium">Стіл {table.number}</span>
                          {table.guestCount && (
                            <span className="text-xs text-muted-foreground">
                              <Users className="h-3 w-3 inline mr-0.5" />
                              {table.guestCount}
                            </span>
                          )}
                        </div>
                        {table.number === tableNumber && (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-900">
                      Стіл {tableNumber}
                    </span>
                  </div>
                  <div className="w-px h-5 bg-slate-200 hidden sm:block" />
                  <TableTimer occupiedAt={tableOccupiedAt} />
                </div>
              )}
            </div>
          )}

          {/* Right: Table Actions */}
          {tableNumber && hasTableActions && (
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Request Check - primary action */}
                {onRequestCheck && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={onRequestCheck}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Запит рахунку</TooltipContent>
                  </Tooltip>
                )}

                {/* Transfer Table */}
                {onTransferTable && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={onTransferTable}
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hidden sm:flex"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Перенести гостей</TooltipContent>
                  </Tooltip>
                )}

                {/* More Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onTransferTable && (
                      <DropdownMenuItem onClick={onTransferTable} className="gap-3 sm:hidden">
                        <ArrowRightLeft className="h-4 w-4" />
                        Перенести гостей
                      </DropdownMenuItem>
                    )}
                    {onAddNote && (
                      <DropdownMenuItem onClick={onAddNote} className="gap-3">
                        <StickyNote className="h-4 w-4" />
                        Нотатка до столу
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onCloseTable && (
                      <DropdownMenuItem
                        onClick={onCloseTable}
                        className="gap-3 text-red-600 focus:text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Закрити стіл
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TooltipProvider>
          )}

          {/* Spacer for mobile when no table */}
          {!tableNumber && <div className="lg:hidden" />}
        </div>
      </div>
    </nav>
  );
}
