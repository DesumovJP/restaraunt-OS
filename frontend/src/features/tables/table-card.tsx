'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Table } from '@/types/table';
import { Users, CheckCircle2, Clock, Circle } from 'lucide-react';

interface TableCardProps {
  table: Table;
  onSelect: (table: Table) => void;
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
    <div className="flex items-center gap-1 text-xs font-medium text-slate-600 mt-1">
      <Clock className="w-3 h-3" />
      <span>{elapsed}</span>
    </div>
  );
}

const statusConfig = {
  free: {
    label: 'Вільний',
    color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  occupied: {
    label: 'Зайнятий',
    color: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
    icon: Clock,
    iconColor: 'text-amber-600',
  },
  reserved: {
    label: 'Заброньовано',
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
    icon: Circle,
    iconColor: 'text-blue-600',
  },
};

export function TableCard({ table, onSelect }: TableCardProps) {
  const config = statusConfig[table.status];
  const StatusIcon = config.icon;
  
  // Дозволяємо вибір вільних та зайнятих столиків (для обслуговування)
  // Заброньовані столики також доступні для перегляду/обслуговування
  const isSelectable = true; // Всі столики доступні для обслуговування

  return (
    <button
      onClick={() => onSelect(table)}
      disabled={!isSelectable}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2',
        isSelectable
          ? table.status === 'free'
            ? 'bg-white/70 backdrop-blur-md border-slate-200 hover:border-accent-400 hover:shadow-lg cursor-pointer'
            : 'bg-white/70 backdrop-blur-md border-amber-300 hover:border-amber-400 hover:shadow-lg cursor-pointer'
          : 'bg-white/40 backdrop-blur-sm cursor-not-allowed opacity-75'
      )}
    >
      {/* Table Number */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            'text-3xl font-bold transition-colors',
            isSelectable ? 'text-navy-900' : 'text-slate-400'
          )}
        >
          {table.number}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Users className="w-4 h-4" />
          <span>{table.capacity} місць</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
            config.color
          )}
        >
          <StatusIcon className={cn('w-3.5 h-3.5', config.iconColor)} />
          <span>{config.label}</span>
        </div>
        {/* Timer */}
        <TableTimer occupiedAt={table.occupiedAt} />
      </div>

      {/* Hover Effect */}
      {isSelectable && (
        <div className="absolute inset-0 rounded-2xl bg-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}
