import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Table } from '@/types/table';

interface TableStore {
  tables: Table[];
  selectedTable: Table | null;

  // Actions
  setTables: (tables: Table[]) => void;
  selectTable: (table: Table) => void;
  clearSelectedTable: () => void;
  updateTableStatus: (tableId: string, status: Table['status']) => void;
}

export const useTableStore = create<TableStore>()(
  persist(
    (set) => ({
      tables: Array.from({ length: 20 }, (_, i) => ({
        id: `table-${i + 1}`,
        number: i + 1,
        status: 'free' as const,
        capacity: i < 10 ? 4 : 6,
      })),
      selectedTable: null,

      setTables: (tables) => set({ tables }),

      selectTable: (table) => set({ selectedTable: table }),

      clearSelectedTable: () => set({ selectedTable: null }),

      updateTableStatus: (tableId, status) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === tableId ? { ...table, status } : table
          ),
        })),
    }),
    {
      name: 'restaurant-tables',
    }
  )
);
