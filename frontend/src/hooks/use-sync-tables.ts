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
import type { Table, TableStatus, TableZone } from '@/types/table';

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

// Demo mock data - used when backend is unavailable
const DEMO_TABLES: Table[] = [
  // Main hall - 10 tables
  { id: 'table-1', number: 1, capacity: 2, status: 'free', zone: 'main' },
  { id: 'table-2', number: 2, capacity: 4, status: 'occupied', zone: 'main', occupiedAt: new Date(Date.now() - 45 * 60000), currentGuests: 3 },
  { id: 'table-3', number: 3, capacity: 4, status: 'free', zone: 'main' },
  { id: 'table-4', number: 4, capacity: 6, status: 'occupied', zone: 'main', occupiedAt: new Date(Date.now() - 120 * 60000), currentGuests: 5 },
  { id: 'table-5', number: 5, capacity: 2, status: 'reserved', zone: 'main', reservedBy: 'Олександр Ш.', reservedAt: new Date() },
  { id: 'table-6', number: 6, capacity: 4, status: 'free', zone: 'main' },
  { id: 'table-7', number: 7, capacity: 4, status: 'free', zone: 'main' },
  { id: 'table-8', number: 8, capacity: 8, status: 'occupied', zone: 'main', occupiedAt: new Date(Date.now() - 30 * 60000), currentGuests: 6 },
  { id: 'table-9', number: 9, capacity: 2, status: 'free', zone: 'main' },
  { id: 'table-10', number: 10, capacity: 4, status: 'free', zone: 'main' },

  // Terrace - 6 tables
  { id: 'table-11', number: 11, capacity: 4, status: 'free', zone: 'terrace' },
  { id: 'table-12', number: 12, capacity: 4, status: 'occupied', zone: 'terrace', occupiedAt: new Date(Date.now() - 60 * 60000), currentGuests: 4 },
  { id: 'table-13', number: 13, capacity: 6, status: 'free', zone: 'terrace' },
  { id: 'table-14', number: 14, capacity: 2, status: 'free', zone: 'terrace' },
  { id: 'table-15', number: 15, capacity: 4, status: 'reserved', zone: 'terrace', reservedBy: 'Марія К.', reservedAt: new Date() },
  { id: 'table-16', number: 16, capacity: 8, status: 'free', zone: 'terrace' },

  // VIP - 4 tables
  { id: 'table-17', number: 17, capacity: 6, status: 'occupied', zone: 'vip', occupiedAt: new Date(Date.now() - 90 * 60000), currentGuests: 4 },
  { id: 'table-18', number: 18, capacity: 8, status: 'free', zone: 'vip' },
  { id: 'table-19', number: 19, capacity: 10, status: 'reserved', zone: 'vip', reservedBy: 'Компанія "Укрпром"', reservedAt: new Date() },
  { id: 'table-20', number: 20, capacity: 12, status: 'free', zone: 'vip' },

  // Bar - 5 tables
  { id: 'table-21', number: 21, capacity: 2, status: 'occupied', zone: 'bar', occupiedAt: new Date(Date.now() - 15 * 60000), currentGuests: 2 },
  { id: 'table-22', number: 22, capacity: 2, status: 'free', zone: 'bar' },
  { id: 'table-23', number: 23, capacity: 3, status: 'occupied', zone: 'bar', occupiedAt: new Date(Date.now() - 40 * 60000), currentGuests: 3 },
  { id: 'table-24', number: 24, capacity: 2, status: 'free', zone: 'bar' },
  { id: 'table-25', number: 25, capacity: 4, status: 'free', zone: 'bar' },
];

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
      zone: st.zone as TableZone | undefined,
    }));
  }, []);

  // Sync tables from Strapi - Strapi is source of truth
  useEffect(() => {
    if (fetching) return;

    // If we have Strapi data, use it
    if (data?.tables && data.tables.length > 0) {
      const strapiTables: StrapiTable[] = data.tables;
      const tables = transformTables(strapiTables);
      setTables(tables);
      console.log('[SyncTables] Synced', tables.length, 'tables from Strapi');
    } else if (error || !data?.tables || data.tables.length === 0) {
      // Use demo data when backend is unavailable or returns empty
      // This allows the app to work for investor demos without backend
      const currentTables = useTableStore.getState().tables;
      if (currentTables.length === 0) {
        setTables(DEMO_TABLES);
        console.log('[SyncTables] Using demo tables (backend unavailable)');
      }
    }
  }, [data, fetching, error, setTables, transformTables]);

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
