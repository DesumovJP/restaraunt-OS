'use client';

import * as React from 'react';
import { Menu, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopNavbarProps {
  onMenuClick?: () => void;
  tableNumber?: number;
  tableOccupiedAt?: Date | string;
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
}: TopNavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Menu button (mobile) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors touch-feedback"
            aria-label="Меню"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Center/Right: Table Number with Premium Badge */}
          {tableNumber && (
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-900">
                  Стіл {tableNumber}
                </span>
              </div>
              <div className="w-px h-5 bg-slate-200" />
              <TableTimer occupiedAt={tableOccupiedAt} />
            </div>
          )}

          {/* Spacer for mobile when no table */}
          {!tableNumber && <div className="lg:hidden" />}
        </div>
      </div>
    </nav>
  );
}
