'use client';

import { useRouter } from 'next/navigation';
import { useTableStore } from '@/stores/table-store';
import { TableGrid } from '@/features/tables/table-grid';
import type { Table } from '@/types/table';

export default function TableSelectionPage() {
  const router = useRouter();
  const selectTable = useTableStore((state) => state.selectTable);
  const updateTableStatus = useTableStore((state) => state.updateTableStatus);

  const handleTableSelect = (table: Table) => {
    // Select the table and mark it as occupied
    selectTable(table);
    updateTableStatus(table.id, 'occupied');

    // Navigate to the POS screen
    router.push('/pos/waiter');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 via-white to-accent-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-navy-900">
              Оберіть стіл
            </h1>
            <p className="text-slate-600 mt-1">
              Виберіть вільний стіл для обслуговування
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 bg-white/70 backdrop-blur-md rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-700">Вільний</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-slate-700">Зайнятий</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-slate-700">Заброньовано</span>
          </div>
        </div>

        {/* Table Grid */}
        <TableGrid onTableSelect={handleTableSelect} />
      </div>
    </div>
  );
}
