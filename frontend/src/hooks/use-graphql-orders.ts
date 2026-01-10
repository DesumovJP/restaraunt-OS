/**
 * Orders GraphQL Hooks
 * Hooks for order operations using urql
 *
 * @description Provides hooks for order management
 * @module hooks/use-graphql-orders
 */

'use client';

import { useQuery, useMutation } from 'urql';
import { useMemo, useCallback } from 'react';
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

// ============================================
// LOGGING UTILITIES
// ============================================

const LOG_PREFIX = '[Orders]';
const LOG_COLORS = {
  info: 'color: #3B82F6',
  success: 'color: #10B981',
  error: 'color: #EF4444',
  warn: 'color: #F59E0B',
  mutation: 'color: #8B5CF6',
  query: 'color: #06B6D4',
};

interface OrderLogContext {
  orderId?: string;
  orderNumber?: string;
  tableId?: string;
  tableNumber?: number;
  itemCount?: number;
  status?: string;
  duration?: number;
  [key: string]: unknown;
}

function logOrder(
  level: keyof typeof LOG_COLORS,
  message: string,
  context?: OrderLogContext
) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  const prefix = `%c${LOG_PREFIX} [${timestamp}]`;

  if (context) {
    console.log(prefix, LOG_COLORS[level], message, context);
  } else {
    console.log(prefix, LOG_COLORS[level], message);
  }
}

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
    const startTime = performance.now();
    logOrder('mutation', '→ CREATE_ORDER', {
      tableId: data.table,
      guestCount: data.guestCount,
    });

    const result = await executeMutation({
      data: {
        ...data,
        status: 'new',
        totalAmount: 0,
        taxAmount: 0,
      },
    });

    const duration = Math.round(performance.now() - startTime);

    if (result.error) {
      logOrder('error', '✗ CREATE_ORDER failed', {
        tableId: data.table,
        duration,
        error: result.error.message,
      });
      throw new Error(result.error.message);
    }

    const order = result.data?.createOrder;
    logOrder('success', '✓ CREATE_ORDER completed', {
      orderId: order?.documentId,
      orderNumber: order?.orderNumber,
      tableNumber: order?.table?.number,
      duration,
    });

    return order;
  }, [executeMutation]);

  return { createOrder, loading: fetching };
}

/**
 * Hook for updating order status
 */
export function useUpdateOrderStatus() {
  const [{ fetching }, executeMutation] = useMutation(UPDATE_ORDER_STATUS);

  const updateStatus = useCallback(async (documentId: string, status: string) => {
    const startTime = performance.now();
    logOrder('mutation', `→ UPDATE_ORDER_STATUS: ${status}`, {
      orderId: documentId,
      status,
    });

    const result = await executeMutation({ documentId, status });
    const duration = Math.round(performance.now() - startTime);

    if (result.error) {
      logOrder('error', '✗ UPDATE_ORDER_STATUS failed', {
        orderId: documentId,
        status,
        duration,
        error: result.error.message,
      });
      throw new Error(result.error.message);
    }

    logOrder('success', `✓ Order status → ${status}`, {
      orderId: documentId,
      status,
      duration,
    });

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
    const startTime = performance.now();
    logOrder('mutation', '→ CREATE_ORDER_ITEM', {
      orderId: data.order,
      menuItemId: data.menuItem,
      quantity: data.quantity,
      price: data.unitPrice,
      courseType: data.courseType,
    });

    const result = await executeMutation({
      data: {
        ...data,
        totalPrice: data.quantity * data.unitPrice,
        status: 'draft',
      },
    });

    const duration = Math.round(performance.now() - startTime);

    if (result.error) {
      logOrder('error', '✗ CREATE_ORDER_ITEM failed', {
        orderId: data.order,
        duration,
        error: result.error.message,
      });
      throw new Error(result.error.message);
    }

    const item = result.data?.createOrderItem;
    logOrder('success', '✓ Item added to order', {
      orderId: data.order,
      itemId: item?.documentId,
      menuItem: item?.menuItem?.name,
      quantity: data.quantity,
      duration,
    });

    return item;
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
