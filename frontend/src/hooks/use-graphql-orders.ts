/**
 * Orders GraphQL Hooks
 * Hooks for order operations using urql
 *
 * @description Provides hooks for order management
 * @module hooks/use-graphql-orders
 */

'use client';

import { useQuery, useMutation, useCallback } from 'urql';
import { useMemo } from 'react';
import {
  GET_ACTIVE_ORDERS,
  GET_ORDER_DETAILS,
  GET_TABLES
} from '@/graphql/queries';
import {
  CREATE_ORDER,
  UPDATE_ORDER_STATUS,
  CREATE_ORDER_ITEM,
  UPDATE_ORDER_ITEM_STATUS,
  UPDATE_TABLE_STATUS
} from '@/graphql/mutations';

// Types
interface OrderItem {
  documentId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  statusChangedAt?: string;
  courseType: string;
  courseIndex?: number;
  notes?: string;
  comment?: any;
  modifiers?: any[];
  prepStartAt?: string;
  prepElapsedMs?: number;
  servedAt?: string;
  menuItem: {
    documentId: string;
    name: string;
    nameUk?: string;
    price: number;
    preparationTime?: number;
    image?: { url: string };
  };
}

interface Order {
  documentId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  tipAmount?: number;
  guestCount: number;
  notes?: string;
  tableStartAt?: string;
  paidAt?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  table: {
    documentId: string;
    number: number;
    capacity?: number;
    zone?: string;
  };
  waiter?: {
    documentId: string;
    username: string;
  };
  items: OrderItem[];
  tickets?: any[];
}

interface Table {
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

/**
 * Hook for fetching active orders
 *
 * @returns Active orders data
 *
 * @example
 * ```tsx
 * const { orders, loading, error, refetch } = useActiveOrders();
 * ```
 */
export function useActiveOrders() {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_ACTIVE_ORDERS,
    requestPolicy: 'cache-and-network',
  });

  const orders: Order[] = data?.orders || [];

  // Group orders by status
  const ordersByStatus = useMemo(() => {
    return {
      new: orders.filter((o) => o.status === 'new'),
      confirmed: orders.filter((o) => o.status === 'confirmed'),
      in_kitchen: orders.filter((o) => o.status === 'in_kitchen'),
      ready: orders.filter((o) => o.status === 'ready'),
      served: orders.filter((o) => o.status === 'served'),
    };
  }, [orders]);

  // Group orders by table
  const ordersByTable = useMemo(() => {
    const map = new Map<number, Order[]>();
    orders.forEach((order) => {
      const tableNum = order.table.number;
      if (!map.has(tableNum)) {
        map.set(tableNum, []);
      }
      map.get(tableNum)!.push(order);
    });
    return map;
  }, [orders]);

  return {
    orders,
    ordersByStatus,
    ordersByTable,
    loading: fetching,
    error: error?.message,
    refetch: reexecuteQuery,
  };
}

/**
 * Hook for fetching a single order by documentId
 *
 * @param documentId - The order document ID
 * @returns Order details
 */
export function useOrderDetails(documentId: string) {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_ORDER_DETAILS,
    variables: { documentId },
    pause: !documentId,
    requestPolicy: 'cache-and-network',
  });

  return {
    order: data?.order as Order | undefined,
    loading: fetching,
    error: error?.message,
    refetch: reexecuteQuery,
  };
}

/**
 * Hook for fetching all tables
 *
 * @returns Tables data with status
 */
export function useTables() {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_TABLES,
    requestPolicy: 'cache-and-network',
  });

  const tables: Table[] = data?.tables || [];

  // Group tables by status
  const tablesByStatus = useMemo(() => {
    return {
      free: tables.filter((t) => t.status === 'free'),
      occupied: tables.filter((t) => t.status === 'occupied'),
      reserved: tables.filter((t) => t.status === 'reserved'),
    };
  }, [tables]);

  // Group tables by zone
  const tablesByZone = useMemo(() => {
    const map = new Map<string, Table[]>();
    tables.forEach((table) => {
      const zone = table.zone || 'main';
      if (!map.has(zone)) {
        map.set(zone, []);
      }
      map.get(zone)!.push(table);
    });
    return map;
  }, [tables]);

  return {
    tables,
    tablesByStatus,
    tablesByZone,
    loading: fetching,
    error: error?.message,
    refetch: reexecuteQuery,
  };
}

/**
 * Hook for creating a new order
 */
export function useCreateOrder() {
  const [{ fetching }, executeMutation] = useMutation(CREATE_ORDER);

  const createOrder = useCallback(async (data: {
    table: string;
    waiter?: string;
    guestCount?: number;
    notes?: string;
  }) => {
    const result = await executeMutation({
      data: {
        ...data,
        status: 'new',
        totalAmount: 0,
        taxAmount: 0,
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.createOrder;
  }, [executeMutation]);

  return { createOrder, loading: fetching };
}

/**
 * Hook for updating order status
 */
export function useUpdateOrderStatus() {
  const [{ fetching }, executeMutation] = useMutation(UPDATE_ORDER_STATUS);

  const updateStatus = useCallback(async (documentId: string, status: string) => {
    const result = await executeMutation({ documentId, status });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.updateOrder;
  }, [executeMutation]);

  return { updateStatus, loading: fetching };
}

/**
 * Hook for adding an item to an order
 */
export function useAddOrderItem() {
  const [{ fetching }, executeMutation] = useMutation(CREATE_ORDER_ITEM);

  const addItem = useCallback(async (data: {
    order: string;
    menuItem: string;
    quantity: number;
    unitPrice: number;
    courseType?: string;
    notes?: string;
  }) => {
    const result = await executeMutation({
      data: {
        ...data,
        totalPrice: data.quantity * data.unitPrice,
        status: 'draft',
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.createOrderItem;
  }, [executeMutation]);

  return { addItem, loading: fetching };
}

/**
 * Hook for updating order item status
 */
export function useUpdateOrderItemStatus() {
  const [{ fetching }, executeMutation] = useMutation(UPDATE_ORDER_ITEM_STATUS);

  const updateItemStatus = useCallback(async (documentId: string, status: string) => {
    const result = await executeMutation({ documentId, status });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.updateOrderItem;
  }, [executeMutation]);

  return { updateItemStatus, loading: fetching };
}

/**
 * Hook for updating table status
 */
export function useUpdateTableStatus() {
  const [{ fetching }, executeMutation] = useMutation(UPDATE_TABLE_STATUS);

  const updateTableStatus = useCallback(async (
    documentId: string,
    status: string,
    currentGuests?: number
  ) => {
    const result = await executeMutation({ documentId, status, currentGuests });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.updateTable;
  }, [executeMutation]);

  return { updateTableStatus, loading: fetching };
}
