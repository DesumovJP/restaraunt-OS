'use client';

import * as React from 'react';
import { Menu, Clock } from 'lucide-react';

interface TopNavbarProps {
  onMenuClick?: () => void;
  tableNumber?: number;
  tableOccupiedAt?: Date | string;
}

// Компонент таймера - видимий і оновлюється частіше
function TableTimer({ occupiedAt }: { occupiedAt?: Date | string }) {
  const [elapsed, setElapsed] = React.useState<string>('00:00');
  const [isValid, setIsValid] = React.useState(false);

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
    <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
      <Clock className="w-4 h-4" />
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
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Menu button (mobile) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden w-11 h-11 rounded-lg flex items-center justify-center hover:bg-slate-100"
            aria-label="Меню"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Center/Right: Table Number */}
          {tableNumber && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <span className="font-semibold text-slate-900">
                Стіл {tableNumber}
              </span>
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
