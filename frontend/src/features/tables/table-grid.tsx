'use client';

import * as React from 'react';
import { TableCard } from './table-card';
import type { Table } from '@/types/table';
import { cn } from '@/lib/utils';
import { TableIcon } from 'lucide-react';

interface TableGridProps {
  tables: Table[];
  onTableSelect: (table: Table) => void;
}

export function TableGrid({ tables, onTableSelect }: TableGridProps) {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <TableIcon className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-lg font-medium text-slate-700">Столи не знайдені</p>
        <p className="text-sm text-slate-500 mt-1">Спробуйте змінити фільтри</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {tables.map((table, index) => (
        <div
          key={table.id}
          className={cn(
            "animate-fade-in-up",
          )}
          style={{
            animationDelay: `${Math.min(index * 30, 300)}ms`,
            animationFillMode: 'both',
          }}
        >
          <TableCard table={table} onSelect={onTableSelect} />
        </div>
      ))}
    </div>
  );
}
