'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Table } from '@/types/table';
import { Users, Clock, Calendar } from 'lucide-react';

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

// Компонент таймера - компактний
function TableTimer({ occupiedAt }: { occupiedAt?: Date | string }) {
  const [elapsed, setElapsed] = React.useState<string>('');

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

      if (hours > 0) {
        setElapsed(`${hours}г ${minutes}хв`);
      } else {
        setElapsed(`${minutes}хв`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // Оновлення раз на 30с достатньо

    return () => clearInterval(interval);
  }, [occupiedAt]);

  if (!occupiedAt || !elapsed) return null;

  return (
    <span className="text-xs font-medium opacity-75">{elapsed}</span>
  );
}

// Конфіг статусів - колір фону картки замість badge
const statusConfig = {
  free: {
    bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    text: 'text-emerald-900',
    accent: 'text-emerald-600',
  },
  occupied: {
    bg: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    text: 'text-amber-900',
    accent: 'text-amber-600',
  },
  reserved: {
    bg: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    text: 'text-blue-900',
    accent: 'text-blue-600',
  },
};

export function TableCard({ table, onSelect, nextReservation }: TableCardProps) {
  const config = statusConfig[table.status];

  return (
    <button
      onClick={() => onSelect(table)}
      className={cn(
        'flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2',
        'transition-colors duration-150 active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'min-h-[100px] cursor-pointer relative',
        config.bg
      )}
    >
      {/* Reservation indicator */}
      {nextReservation && table.status === 'free' && (
        <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
          {nextReservation.time}
        </div>
      )}

      {/* Номер столу - великий і чіткий */}
      <span className={cn('text-3xl font-bold', config.text)}>
        {table.number}
      </span>

      {/* Місця */}
      <div className={cn('flex items-center gap-1 text-sm', config.accent)}>
        <Users className="w-4 h-4" />
        <span>{table.capacity}</span>
      </div>

      {/* Таймер для зайнятих */}
      {table.status === 'occupied' && (
        <div className={cn('flex items-center gap-1 mt-1', config.accent)}>
          <Clock className="w-3 h-3" />
          <TableTimer occupiedAt={table.occupiedAt} />
        </div>
      )}

      {/* Наступне бронювання */}
      {nextReservation && table.status === 'free' && (
        <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
          <Calendar className="w-3 h-3" />
          <span className="truncate max-w-[80px]">
            {nextReservation.contactName || `${nextReservation.guestCount} гостей`}
          </span>
        </div>
      )}

      {/* Reserved info */}
      {table.status === 'reserved' && table.reservedBy && (
        <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 truncate max-w-full">
          <span className="truncate">{table.reservedBy}</span>
        </div>
      )}
    </button>
  );
}
