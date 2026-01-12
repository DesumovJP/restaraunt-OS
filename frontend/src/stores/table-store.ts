import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Table, CloseReason } from '@/types/table';
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
  closeTable: (tableId: string, reason: CloseReason, comment?: string) => Promise<void>; // Закрити стіл з причиною
  extendTableSession: (tableId: string, subtractMinutes: number) => void; // Подовжити сесію столу
  mergeTables: (primaryTableId: string, tableIds: string[]) => void; // Об'єднати столи
  unmergeTables: (primaryTableId: string) => void; // Розділити об'єднані столи
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

      closeTable: async (tableId, reason, comment) => {
        const currentTables = useTableStore.getState().tables;
        const currentTable = currentTables.find((t) => t.id === tableId);

        if (!currentTable) {
          throw new Error('Стіл не знайдено');
        }

        if (!currentTable.documentId) {
          throw new Error('Неможливо закрити стіл: відсутній documentId');
        }

        try {
          // Call backend API to close the table
          const response = await fetch(`/api/tables/${currentTable.documentId}/close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              closeReason: reason,
              comment,
            }),
          });

          if (!response.ok) {
            throw new Error('Помилка при закритті столу');
          }

          // Update local state
          set((state) => ({
            tables: state.tables.map((table) => {
              if (table.id === tableId) {
                return {
                  ...table,
                  status: 'free' as const,
                  occupiedAt: undefined,
                  reservedAt: undefined,
                  reservedBy: undefined,
                  currentGuests: undefined,
                  lastCloseReason: reason,
                };
              }
              return table;
            }),
            // Clear selected table if it was this one
            selectedTable: state.selectedTable?.id === tableId ? null : state.selectedTable,
          }));

          // Log analytics event
          if (currentTable.occupiedAt) {
            const occupiedAtStr = currentTable.occupiedAt instanceof Date
              ? currentTable.occupiedAt.toISOString()
              : String(currentTable.occupiedAt);

            tableSessionEventsApi.createEvent({
              tableNumber: currentTable.number,
              sessionId: `session_${tableId}_closed`,
              eventType: 'table_cleared',
              actorRole: 'waiter',
              tableOccupiedAt: occupiedAtStr,
              metadata: {
                totalSessionTimeMs: Date.now() - new Date(occupiedAtStr).getTime(),
                closeReason: reason,
                comment,
              },
            });
          }
        } catch (error) {
          console.error('Error closing table:', error);
          throw error;
        }
      },

      extendTableSession: (tableId, subtractMinutes) => {
        set((state) => ({
          tables: state.tables.map((table) => {
            if (table.id === tableId && table.occupiedAt) {
              const now = new Date();
              let newOccupiedAt: Date;

              if (subtractMinutes === 0) {
                // Full reset - set to current time
                newOccupiedAt = now;
              } else {
                // Subtract minutes from current session
                const currentOccupiedAt = table.occupiedAt instanceof Date
                  ? table.occupiedAt
                  : new Date(table.occupiedAt);

                // Add minutes to occupiedAt (making session shorter)
                newOccupiedAt = new Date(currentOccupiedAt.getTime() + (subtractMinutes * 60 * 1000));

                // Don't allow future dates
                if (newOccupiedAt > now) {
                  newOccupiedAt = now;
                }
              }

              // Log analytics event
              tableSessionEventsApi.createEvent({
                tableNumber: table.number,
                sessionId: `session_${tableId}_extended`,
                eventType: 'table_seated', // Using table_seated as it's a session event
                actorRole: 'waiter',
                metadata: {
                  action: 'extend_session',
                  subtractMinutes,
                  oldOccupiedAt: table.occupiedAt instanceof Date
                    ? table.occupiedAt.toISOString()
                    : String(table.occupiedAt),
                  newOccupiedAt: newOccupiedAt.toISOString(),
                },
              });

              return { ...table, occupiedAt: newOccupiedAt };
            }
            return table;
          }),
          // Update selected table if it's the one being extended
          selectedTable: state.selectedTable?.id === tableId && state.selectedTable.occupiedAt
            ? (() => {
                const now = new Date();
                let newOccupiedAt: Date;

                if (subtractMinutes === 0) {
                  newOccupiedAt = now;
                } else {
                  const currentOccupiedAt = state.selectedTable.occupiedAt instanceof Date
                    ? state.selectedTable.occupiedAt
                    : new Date(state.selectedTable.occupiedAt);

                  newOccupiedAt = new Date(currentOccupiedAt.getTime() + (subtractMinutes * 60 * 1000));

                  if (newOccupiedAt > now) {
                    newOccupiedAt = now;
                  }
                }

                return { ...state.selectedTable, occupiedAt: newOccupiedAt };
              })()
            : state.selectedTable,
        }));
      },

      mergeTables: (primaryTableId, tableIds) => {
        set((state) => {
          const primaryTable = state.tables.find((t) => t.id === primaryTableId);
          if (!primaryTable) return state;

          // Log analytics event
          tableSessionEventsApi.createEvent({
            tableNumber: primaryTable.number,
            sessionId: `session_${primaryTableId}_merged`,
            eventType: 'table_seated',
            actorRole: 'waiter',
            metadata: {
              action: 'merge_tables',
              primaryTableId,
              mergedTableIds: tableIds,
              tableCount: tableIds.length + 1,
            },
          });

          return {
            tables: state.tables.map((table) => {
              if (table.id === primaryTableId) {
                // Update primary table with merged table IDs
                return {
                  ...table,
                  mergedWith: [...(table.mergedWith || []), ...tableIds],
                };
              }
              if (tableIds.includes(table.id)) {
                // Mark merged tables as merged with primary table ID
                return {
                  ...table,
                  primaryTableId,
                  status: 'occupied' as const, // Set to occupied
                };
              }
              return table;
            }),
          };
        });
      },

      unmergeTables: (primaryTableId) => {
        set((state) => {
          const primaryTable = state.tables.find((t) => t.id === primaryTableId);
          if (!primaryTable || !primaryTable.mergedWith?.length) return state;

          const mergedTableIds = primaryTable.mergedWith;

          // Log analytics event
          tableSessionEventsApi.createEvent({
            tableNumber: primaryTable.number,
            sessionId: `session_${primaryTableId}_unmerged`,
            eventType: 'table_cleared',
            actorRole: 'waiter',
            metadata: {
              action: 'unmerge_tables',
              primaryTableId,
              unmergedTableIds: mergedTableIds,
              tableCount: mergedTableIds.length + 1,
            },
          });

          return {
            tables: state.tables.map((table) => {
              if (table.id === primaryTableId) {
                // Clear merged table IDs from primary table
                return {
                  ...table,
                  mergedWith: undefined,
                };
              }
              if (mergedTableIds.includes(table.id)) {
                // Restore merged tables to their original state
                return {
                  ...table,
                  primaryTableId: undefined,
                  status: 'free' as const, // Set back to free
                };
              }
              return table;
            }),
          };
        });
      },
    }),
    {
      name: 'restaurant-tables',
    }
  )
);
