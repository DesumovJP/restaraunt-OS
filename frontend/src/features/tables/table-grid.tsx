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
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <TableIcon className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">Столи не знайдені</p>
        <p className="text-sm text-muted-foreground">Спробуйте змінити фільтри</p>
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
