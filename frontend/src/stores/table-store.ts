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
  emergencyCloseTable: (tableId: string, reason: CloseReason, comment?: string) => Promise<{ abandonedItemsCount: number; totalLostRevenue: number }>; // Екстрене закриття
  extendTableSession: (tableId: string, subtractMinutes: number) => void; // Подовжити сесію столу
  mergeTables: (primaryTableId: string, tableIds: string[]) => Promise<void>; // Об'єднати столи (з API)
  unmergeTables: (primaryTableId: string) => Promise<void>; // Розділити об'єднані столи (з API)
  transferGuests: (sourceTableId: string, targetTableId: string) => Promise<{ ordersTransferred: number }>; // Перенести гостей
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
        const currentTable = currentTables.find((t) => t.documentId === tableId || t.id === tableId);
        const wasOccupied = currentTable?.status === 'occupied' || currentTable?.status === 'reserved';
        const isBecomingOccupied = (status === 'occupied' || status === 'reserved') && !wasOccupied;
        const isBecomingFree = status === 'free' && wasOccupied;

        set((state) => ({
          tables: state.tables.map((table) => {
            if (table.documentId === tableId || table.id === tableId) {
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
        const currentTable = currentTables.find((t) => t.documentId === tableId || t.id === tableId);

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
              if (table.documentId === tableId || table.id === tableId) {
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
            selectedTable: (state.selectedTable?.documentId === tableId || state.selectedTable?.id === tableId) ? null : state.selectedTable,
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
            if ((table.documentId === tableId || table.id === tableId) && table.occupiedAt) {
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
          selectedTable: (state.selectedTable?.documentId === tableId || state.selectedTable?.id === tableId) && state.selectedTable.occupiedAt
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

      emergencyCloseTable: async (tableId, reason, comment) => {
        const currentTables = useTableStore.getState().tables;
        const currentTable = currentTables.find((t) => t.documentId === tableId || t.id === tableId);

        if (!currentTable) {
          throw new Error('Стіл не знайдено');
        }

        if (!currentTable.documentId) {
          throw new Error('Неможливо закрити стіл: відсутній documentId');
        }

        try {
          // Call backend API for emergency close
          const response = await fetch(`/api/tables/${currentTable.documentId}/emergency-close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reason,
              comment,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Помилка при екстреному закритті столу');
          }

          const result = await response.json();

          // Update local state
          set((state) => ({
            tables: state.tables.map((table) => {
              if (table.documentId === tableId || table.id === tableId) {
                return {
                  ...table,
                  status: 'free' as const,
                  occupiedAt: undefined,
                  reservedAt: undefined,
                  reservedBy: undefined,
                  currentGuests: undefined,
                  lastCloseReason: reason,
                  closeComment: comment,
                  mergedWith: undefined,
                  primaryTableId: undefined,
                };
              }
              // Also free any merged tables
              if (currentTable.mergedWith?.includes(table.documentId || '') || currentTable.mergedWith?.includes(table.id)) {
                return {
                  ...table,
                  status: 'free' as const,
                  occupiedAt: undefined,
                  primaryTableId: undefined,
                };
              }
              return table;
            }),
            selectedTable: (state.selectedTable?.documentId === tableId || state.selectedTable?.id === tableId) ? null : state.selectedTable,
          }));

          return {
            abandonedItemsCount: result.summary?.abandonedItemsCount || 0,
            totalLostRevenue: result.summary?.totalLostRevenue || 0,
          };
        } catch (error) {
          console.error('Error emergency closing table:', error);
          throw error;
        }
      },

      mergeTables: async (primaryTableId, tableIds) => {
        const currentTables = useTableStore.getState().tables;
        const primaryTable = currentTables.find((t) => t.documentId === primaryTableId || t.id === primaryTableId);

        if (!primaryTable) {
          throw new Error('Головний стіл не знайдено');
        }

        if (!primaryTable.documentId) {
          throw new Error("Неможливо об'єднати: відсутній documentId");
        }

        try {
          // Call backend API
          const response = await fetch(`/api/tables/${primaryTable.documentId}/merge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableIds }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Помилка при об'єднанні столів");
          }

          // Update local state
          set((state) => ({
            tables: state.tables.map((table) => {
              if (table.documentId === primaryTableId || table.id === primaryTableId) {
                return {
                  ...table,
                  mergedWith: [...(table.mergedWith || []), ...tableIds],
                  status: 'occupied' as const,
                  occupiedAt: table.occupiedAt || new Date(),
                };
              }
              if (tableIds.includes(table.documentId || '') || tableIds.includes(table.id)) {
                return {
                  ...table,
                  primaryTableId,
                  status: 'occupied' as const,
                  occupiedAt: table.occupiedAt || new Date(),
                };
              }
              return table;
            }),
          }));

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
        } catch (error) {
          console.error('Error merging tables:', error);
          throw error;
        }
      },

      unmergeTables: async (primaryTableId) => {
        const currentTables = useTableStore.getState().tables;
        const primaryTable = currentTables.find((t) => t.documentId === primaryTableId || t.id === primaryTableId);

        if (!primaryTable || !primaryTable.mergedWith?.length) {
          throw new Error("Стіл не має об'єднаних столів");
        }

        if (!primaryTable.documentId) {
          throw new Error("Неможливо роз'єднати: відсутній documentId");
        }

        const mergedTableIds = primaryTable.mergedWith;

        try {
          // Call backend API
          const response = await fetch(`/api/tables/${primaryTable.documentId}/merge`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Помилка при роз'єднанні столів");
          }

          // Update local state
          set((state) => ({
            tables: state.tables.map((table) => {
              if (table.documentId === primaryTableId || table.id === primaryTableId) {
                return {
                  ...table,
                  mergedWith: undefined,
                };
              }
              if (mergedTableIds.includes(table.documentId || '') || mergedTableIds.includes(table.id)) {
                return {
                  ...table,
                  primaryTableId: undefined,
                  status: 'free' as const,
                  occupiedAt: undefined,
                };
              }
              return table;
            }),
          }));

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
        } catch (error) {
          console.error('Error unmerging tables:', error);
          throw error;
        }
      },

      transferGuests: async (sourceTableId, targetTableId) => {
        const currentTables = useTableStore.getState().tables;
        const sourceTable = currentTables.find((t) => t.documentId === sourceTableId || t.id === sourceTableId);
        const targetTable = currentTables.find((t) => t.documentId === targetTableId || t.id === targetTableId);

        if (!sourceTable) {
          throw new Error('Вихідний стіл не знайдено');
        }

        if (!targetTable) {
          throw new Error('Цільовий стіл не знайдено');
        }

        if (!sourceTable.documentId) {
          throw new Error('Неможливо перенести: відсутній documentId');
        }

        try {
          // Call backend API
          const response = await fetch(`/api/tables/${sourceTable.documentId}/transfer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetTableId: targetTable.documentId }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Помилка при перенесенні гостей');
          }

          const result = await response.json();

          // Update local state
          set((state) => ({
            tables: state.tables.map((table) => {
              if (table.documentId === sourceTableId || table.id === sourceTableId) {
                return {
                  ...table,
                  status: 'free' as const,
                  currentGuests: undefined,
                  occupiedAt: undefined,
                  mergedWith: undefined,
                };
              }
              if (table.documentId === targetTableId || table.id === targetTableId) {
                return {
                  ...table,
                  status: 'occupied' as const,
                  currentGuests: sourceTable.currentGuests,
                  occupiedAt: sourceTable.occupiedAt, // Preserve session time
                  mergedWith: sourceTable.mergedWith,
                };
              }
              // Update any merged tables
              if (sourceTable.mergedWith?.includes(table.documentId || '') || sourceTable.mergedWith?.includes(table.id)) {
                return {
                  ...table,
                  primaryTableId: targetTableId,
                };
              }
              return table;
            }),
            selectedTable: null,
          }));

          // Log analytics event
          tableSessionEventsApi.createEvent({
            tableNumber: sourceTable.number,
            sessionId: `session_${sourceTableId}_transfer`,
            eventType: 'table_cleared',
            actorRole: 'waiter',
            metadata: {
              action: 'transfer_guests',
              sourceTableNumber: sourceTable.number,
              targetTableNumber: targetTable.number,
              ordersTransferred: result.ordersTransferred || 0,
            },
          });

          return {
            ordersTransferred: result.ordersTransferred || 0,
          };
        } catch (error) {
          console.error('Error transferring guests:', error);
          throw error;
        }
      },
    }),
    {
      name: 'restaurant-tables',
    }
  )
);
