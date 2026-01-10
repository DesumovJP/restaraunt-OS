/**
 * Hook for syncing tables from Strapi to local store
 *
 * @description Fetches tables from Strapi via GraphQL and updates the local table store.
 * Preserves local state (occupiedAt, status) for tables that are already in use.
 *
 * @example
 * ```tsx
 * // In a layout or provider component
 * useSyncTables();
 * ```
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from 'urql';
import { GET_TABLES } from '@/graphql/queries';
import { useTableStore } from '@/stores/table-store';
import type { Table, TableStatus } from '@/types/table';

interface StrapiTable {
  documentId: string;
  number: number;
  capacity: number;
  status: string;
  currentGuests?: number;
  occupiedAt?: string;
  reservedBy?: string;
  reservedAt?: string;
  zone?: string;
}

export function useSyncTables() {
  const [{ data, fetching, error }] = useQuery({
    query: GET_TABLES,
    requestPolicy: 'cache-and-network',
  });

  const setTables = useTableStore((state) => state.setTables);
  const localTables = useTableStore((state) => state.tables);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (fetching || !data?.tables) return;

    const strapiTables: StrapiTable[] = data.tables;

    if (strapiTables.length === 0) return;

    // Create a map of local tables for quick lookup
    const localTableMap = new Map(
      localTables.map(t => [t.number, t])
    );

    // Merge Strapi tables with local state
    const mergedTables: Table[] = strapiTables.map((st) => {
      const localTable = localTableMap.get(st.number);

      // If table exists locally and is occupied/reserved, preserve local state
      if (localTable && (localTable.status === 'occupied' || localTable.status === 'reserved')) {
        return {
          ...localTable,
          // Update with Strapi documentId (critical for GraphQL mutations)
          documentId: st.documentId,
          // Update capacity from Strapi if changed
          capacity: st.capacity,
          zone: st.zone,
        };
      }

      // Otherwise, use Strapi data
      return {
        id: `table-${st.number}`,
        documentId: st.documentId,
        number: st.number,
        capacity: st.capacity,
        status: (st.status || 'free') as TableStatus,
        currentGuests: st.currentGuests,
        occupiedAt: st.occupiedAt ? new Date(st.occupiedAt) : undefined,
        reservedBy: st.reservedBy,
        reservedAt: st.reservedAt ? new Date(st.reservedAt) : undefined,
        zone: st.zone,
      };
    });

    // Only update if tables changed or first sync
    if (!hasSynced.current || strapiTables.length !== localTables.length) {
      setTables(mergedTables);
      hasSynced.current = true;
      console.log('[SyncTables] Synced', mergedTables.length, 'tables from Strapi');
    }
  }, [data, fetching, localTables, setTables]);

  return {
    loading: fetching,
    error: error?.message,
    synced: hasSynced.current,
  };
}
