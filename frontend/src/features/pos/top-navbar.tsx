'use client';

import * as React from 'react';
import { Bell, User, LayoutGrid, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopNavbarProps {
  userName?: string;
  userRole?: string;
  onMenuClick?: () => void;
  tableNumber?: number;
  tableOccupiedAt?: Date | string; // Час зайняття столика для таймера
}

// Компонент таймера для відображення часу з моменту зайняття столика
function TableTimer({ occupiedAt }: { occupiedAt?: Date | string }) {
  const [elapsed, setElapsed] = React.useState<string>('');

  React.useEffect(() => {
    if (!occupiedAt) {
      setElapsed('');
      return;
    }

    // Конвертуємо в Date об'єкт, якщо це рядок (після серіалізації)
    const startDate = occupiedAt instanceof Date ? occupiedAt : new Date(occupiedAt);

    const updateTimer = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      
      // Перевірка на валідність дати
      if (isNaN(diff) || diff < 0) {
        setElapsed('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setElapsed(`${hours}г ${minutes}х`);
      } else if (minutes > 0) {
        setElapsed(`${minutes}х ${seconds}с`);
      } else {
        setElapsed(`${seconds}с`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [occupiedAt]);

  if (!occupiedAt || !elapsed) return null;

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
      <Clock className="w-3 h-3" />
      <span>{elapsed}</span>
    </div>
  );
}

export function TopNavbar({
  userName = 'Courtney Henry',
  userRole = 'Cashier 1st Shift',
  onMenuClick,
  tableNumber,
  tableOccupiedAt,
}: TopNavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Left Section: Menu button (mobile) and Table Number */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              aria-label="Open menu"
            >
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Table Number with Timer */}
            {tableNumber && (
              <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
                <span className="text-sm sm:text-base font-semibold text-blue-700">
                  Столик {tableNumber}
                </span>
                <TableTimer occupiedAt={tableOccupiedAt} />
              </div>
            )}
          </div>

          {/* Right Section: Icons and User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Notification Bell */}
            <button
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-600">{userRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
