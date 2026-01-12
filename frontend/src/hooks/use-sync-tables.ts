/**
 * Hook for syncing tables from Strapi to local store
 *
 * @description Fetches tables from Strapi via GraphQL and updates the local table store.
 * Strapi is the source of truth - all workers see the same data.
 * Uses polling to keep data fresh across multiple devices.
 *
 * @example
 * ```tsx
 * // In a layout or provider component
 * const { refetch } = useSyncTables();
 * ```
 */

'use client';

import { useEffect, useCallback } from 'react';
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

// Polling interval for multi-worker sync (5 seconds)
const POLL_INTERVAL = 5000;

export function useSyncTables() {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_TABLES,
    requestPolicy: 'cache-and-network',
  });

  const setTables = useTableStore((state) => state.setTables);

  // Transform Strapi tables to local format
  const transformTables = useCallback((strapiTables: StrapiTable[]): Table[] => {
    return strapiTables.map((st) => ({
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
    }));
  }, []);

  // Sync tables from Strapi - Strapi is source of truth
  useEffect(() => {
    if (fetching || !data?.tables) return;

    const strapiTables: StrapiTable[] = data.tables;
    if (strapiTables.length === 0) return;

    // Always use Strapi data as source of truth
    const tables = transformTables(strapiTables);
    setTables(tables);
    console.log('[SyncTables] Synced', tables.length, 'tables from Strapi');
  }, [data, fetching, setTables, transformTables]);

  // Polling for multi-worker sync
  useEffect(() => {
    const interval = setInterval(() => {
      reexecuteQuery({ requestPolicy: 'network-only' });
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [reexecuteQuery]);

  // Manual refetch function
  const refetch = useCallback(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [reexecuteQuery]);

  return {
    loading: fetching,
    error: error?.message,
    refetch,
  };
}
