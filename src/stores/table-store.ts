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
  resetAllTables: () => void; // Скинути всі столики до вільного стану
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
          tables: state.tables.map((table) => {
            if (table.id === tableId) {
              // При зайнятті або резервуванні зберігаємо час початку
              let occupiedAt: Date | undefined;
              if ((status === 'occupied' || status === 'reserved') && !table.occupiedAt) {
                occupiedAt = new Date();
              } else if (status === 'free') {
                occupiedAt = undefined;
              } else {
                // Зберігаємо існуючий час, але переконуємося, що це Date об'єкт
                occupiedAt = table.occupiedAt 
                  ? (table.occupiedAt instanceof Date ? table.occupiedAt : new Date(table.occupiedAt))
                  : undefined;
              }
              
              return { ...table, status, occupiedAt };
            }
            // Для інших столиків також переконуємося, що occupiedAt - це Date
            return {
              ...table,
              occupiedAt: table.occupiedAt 
                ? (table.occupiedAt instanceof Date ? table.occupiedAt : new Date(table.occupiedAt))
                : undefined,
            };
          }),
        })),

      resetAllTables: () =>
        set((state) => ({
          tables: state.tables.map((table) => ({
            ...table,
            status: 'free' as const,
            occupiedAt: undefined,
            reservedAt: undefined,
            reservedBy: undefined,
            currentGuests: undefined,
          })),
          selectedTable: null,
        })),
    }),
    {
      name: 'restaurant-tables',
    }
  )
);
