'use client';

import { cn } from '@/lib/utils';
import type { Table } from '@/types/table';
import { Users, CheckCircle2, Clock, Circle } from 'lucide-react';

interface TableCardProps {
  table: Table;
  onSelect: (table: Table) => void;
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

  return (
    <button
      onClick={() => onSelect(table)}
      disabled={table.status !== 'free'}
      className={cn(
        'group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2',
        table.status === 'free'
          ? 'bg-white/70 backdrop-blur-md border-slate-200 hover:border-accent-400 hover:shadow-lg cursor-pointer'
          : 'bg-white/40 backdrop-blur-sm cursor-not-allowed opacity-75'
      )}
    >
      {/* Table Number */}
      <div className="flex flex-col items-center gap-2">
        <div
          className={cn(
            'text-3xl font-bold transition-colors',
            table.status === 'free' ? 'text-navy-900' : 'text-slate-400'
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
      <div
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
          config.color
        )}
      >
        <StatusIcon className={cn('w-3.5 h-3.5', config.iconColor)} />
        <span>{config.label}</span>
      </div>

      {/* Hover Effect */}
      {table.status === 'free' && (
        <div className="absolute inset-0 rounded-2xl bg-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}
