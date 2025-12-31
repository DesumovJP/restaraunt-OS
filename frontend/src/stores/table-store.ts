import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Table } from '@/types/table';
import { tableSessionEventsApi } from '@/lib/api-events';

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
      // TODO: Load tables from database via setTables()
      // Tables should be configured in admin panel and fetched on app init
      tables: [],
      selectedTable: null,

      setTables: (tables) => set({ tables }),

      selectTable: (table) => set({ selectedTable: table }),

      clearSelectedTable: () => set({ selectedTable: null }),

      updateTableStatus: (tableId, status) => {
        // Get current table state before update
        const currentTables = useTableStore.getState().tables;
        const currentTable = currentTables.find((t) => t.id === tableId);
        const wasOccupied = currentTable?.status === 'occupied' || currentTable?.status === 'reserved';
        const isBecomingOccupied = (status === 'occupied' || status === 'reserved') && !wasOccupied;
        const isBecomingFree = status === 'free' && wasOccupied;

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
        }));

        // Log analytics events (non-blocking)
        if (currentTable) {
          const sessionId = `session_${tableId}_${Date.now()}`;

          if (isBecomingOccupied) {
            // Log table_seated event
            tableSessionEventsApi.createEvent({
              tableNumber: currentTable.number,
              sessionId,
              eventType: 'table_seated',
              actorRole: 'waiter',
              metadata: {
                capacity: currentTable.capacity,
                currentGuests: currentTable.currentGuests,
              },
            });
          }

          if (isBecomingFree && currentTable.occupiedAt) {
            // Log table_cleared event
            const occupiedAtStr = currentTable.occupiedAt instanceof Date
              ? currentTable.occupiedAt.toISOString()
              : String(currentTable.occupiedAt);

            tableSessionEventsApi.createEvent({
              tableNumber: currentTable.number,
              sessionId: `session_${tableId}_cleared`,
              eventType: 'table_cleared',
              actorRole: 'waiter',
              tableOccupiedAt: occupiedAtStr,
              metadata: {
                totalSessionTimeMs: Date.now() - new Date(occupiedAtStr).getTime(),
              },
            });
          }
        }
      },

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
