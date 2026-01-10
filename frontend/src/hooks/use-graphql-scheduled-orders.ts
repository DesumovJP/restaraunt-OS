"use client";

/**
 * GraphQL Scheduled Orders Hooks
 *
 * Provides React hooks for scheduled orders and reservations with GraphQL backend.
 * Syncs with local Zustand store for offline support.
 *
 * @module hooks/use-graphql-scheduled-orders
 */

import * as React from "react";
import { useQuery, useMutation } from "urql";
import {
  GET_SCHEDULED_ORDERS,
  GET_SCHEDULED_ORDER,
  GET_ORDERS_READY_TO_ACTIVATE,
  GET_RESERVATIONS_FOR_DATE,
  GET_UPCOMING_RESERVATIONS,
} from "@/graphql/queries";
import {
  CREATE_SCHEDULED_ORDER,
  UPDATE_SCHEDULED_ORDER,
  UPDATE_SCHEDULED_ORDER_STATUS,
  DELETE_SCHEDULED_ORDER,
  CREATE_RESERVATION,
  UPDATE_RESERVATION,
  UPDATE_RESERVATION_STATUS,
} from "@/graphql/mutations";
import {
  useScheduledOrdersStore,
  type ScheduledOrder,
  type EventType,
  type SeatingArea,
  type MenuPreset,
  type PaymentStatus,
} from "@/stores/scheduled-orders-store";

// ==========================================
// TYPES
// ==========================================

interface ScheduledOrderFromAPI {
  documentId: string;
  scheduledFor: string;
  prepStartAt: string;
  status: string;
  guestCount: number;
  adultsCount?: number;
  childrenCount?: number;
  eventType?: string;
  eventName?: string;
  seatingArea?: string;
  menuPreset?: string;
  items: unknown[];
  totalAmount: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactCompany?: string;
  paymentStatus?: string;
  depositAmount?: number;
  depositPaidAt?: string;
  dietaryRequirements?: unknown;
  courseTimeline?: unknown[];
  checklist?: unknown[];
  decorations?: string;
  musicPreference?: string;
  cakeDetails?: string;
  notes?: string;
  confirmedAt?: string;
  table?: {
    documentId: string;
    number: number;
    capacity: number;
  };
}

interface ReservationFromAPI {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  status: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  notes?: string;
  specialRequests?: string;
  occasion?: string;
  source?: string;
  confirmationCode?: string;
  confirmedAt?: string;
  table?: {
    documentId: string;
    number: number;
    capacity: number;
    zone?: string;
  };
}

export interface Reservation extends Omit<ReservationFromAPI, 'table'> {
  tableId: string;
  tableNumber: number;
}

// ==========================================
// TRANSFORM FUNCTIONS
// ==========================================

function transformScheduledOrder(order: ScheduledOrderFromAPI): ScheduledOrder {
  return {
    id: order.documentId,
    tableNumber: order.table?.number || 0,
    tableId: order.table?.documentId || "",
    items: Array.isArray(order.items) ? order.items.map((item: any) => ({
      menuItemId: item.menuItemId || item.documentId,
      menuItemName: item.menuItemName || item.name,
      quantity: item.quantity || 1,
      price: item.price || 0,
      notes: item.notes,
      outputType: item.outputType,
      preparationTime: item.preparationTime,
      courseNumber: item.courseNumber,
    })) : [],
    totalAmount: order.totalAmount || 0,
    scheduledFor: order.scheduledFor,
    prepStartAt: order.prepStartAt,
    scheduleStatus: order.status as any,
    createdAt: order.confirmedAt || new Date().toISOString(),
    notes: order.notes,
    guestCount: order.guestCount,
    eventType: order.eventType as EventType | undefined,
    eventName: order.eventName,
    seatingArea: order.seatingArea as SeatingArea | undefined,
    adultsCount: order.adultsCount,
    childrenCount: order.childrenCount,
    contact: order.contactName ? {
      name: order.contactName,
      phone: order.contactPhone || "",
      email: order.contactEmail,
      company: order.contactCompany,
    } : undefined,
    menuPreset: order.menuPreset as MenuPreset | undefined,
    paymentStatus: order.paymentStatus as PaymentStatus | undefined,
    depositAmount: order.depositAmount,
    depositPaidAt: order.depositPaidAt,
    dietaryRequirements: order.dietaryRequirements as any,
    courseTimeline: order.courseTimeline as any,
    checklist: order.checklist as any,
    decorations: order.decorations,
    musicPreference: order.musicPreference,
    cakeDetails: order.cakeDetails,
    confirmedAt: order.confirmedAt,
  };
}

function transformReservation(res: ReservationFromAPI): Reservation {
  return {
    ...res,
    tableId: res.table?.documentId || "",
    tableNumber: res.table?.number || 0,
  };
}

// ==========================================
// SCHEDULED ORDERS HOOKS
// ==========================================

/**
 * Fetch scheduled orders for a date range
 */
export function useScheduledOrders(options?: {
  fromDate?: string;
  toDate?: string;
  status?: string[];
}) {
  const [result, reexecuteQuery] = useQuery({
    query: GET_SCHEDULED_ORDERS,
    variables: {
      fromDate: options?.fromDate,
      toDate: options?.toDate,
      status: options?.status || ["scheduled", "activating", "activated"],
    },
    pause: !options?.fromDate,
  });

  // Sync with local store
  const localOrders = useScheduledOrdersStore((s) => s.orders);

  const orders = React.useMemo(() => {
    if (result.data?.scheduledOrders?.length > 0) {
      return result.data.scheduledOrders.map(transformScheduledOrder);
    }
    // Fallback to local store if GraphQL fails
    if (result.error) {
      console.warn("[ScheduledOrders] Using local store due to GraphQL error");
      return localOrders;
    }
    return result.data?.scheduledOrders?.map(transformScheduledOrder) || [];
  }, [result.data, result.error, localOrders]);

  const refetch = React.useCallback(() => {
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  return {
    orders,
    isLoading: result.fetching,
    error: result.error?.message || null,
    refetch,
  };
}

/**
 * Fetch orders ready to activate (prep time has passed)
 */
export function useOrdersReadyToActivate() {
  const [result, reexecuteQuery] = useQuery({
    query: GET_ORDERS_READY_TO_ACTIVATE,
    variables: { now: new Date().toISOString() },
  });

  const orders = React.useMemo(() => {
    return result.data?.scheduledOrders?.map(transformScheduledOrder) || [];
  }, [result.data]);

  return {
    orders,
    isLoading: result.fetching,
    refetch: () => reexecuteQuery({ requestPolicy: "network-only" }),
  };
}

/**
 * Create a new scheduled order
 */
export function useCreateScheduledOrder() {
  const [result, executeMutation] = useMutation(CREATE_SCHEDULED_ORDER);
  const addLocalOrder = useScheduledOrdersStore((s) => s.addOrder);

  const createOrder = React.useCallback(
    async (orderData: Omit<ScheduledOrder, "id" | "createdAt" | "scheduleStatus">) => {
      // Transform to API format
      const data = {
        table: orderData.tableId,
        scheduledFor: orderData.scheduledFor,
        prepStartAt: orderData.prepStartAt,
        guestCount: orderData.guestCount,
        adultsCount: orderData.adultsCount,
        childrenCount: orderData.childrenCount,
        eventType: orderData.eventType,
        eventName: orderData.eventName,
        seatingArea: orderData.seatingArea,
        menuPreset: orderData.menuPreset,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        contactName: orderData.contact?.name,
        contactPhone: orderData.contact?.phone,
        contactEmail: orderData.contact?.email,
        contactCompany: orderData.contact?.company,
        paymentStatus: orderData.paymentStatus,
        depositAmount: orderData.depositAmount,
        dietaryRequirements: orderData.dietaryRequirements,
        decorations: orderData.decorations,
        musicPreference: orderData.musicPreference,
        cakeDetails: orderData.cakeDetails,
        notes: orderData.notes,
      };

      try {
        const response = await executeMutation({ data });

        if (response.error) {
          // Fallback to local store
          console.warn("[ScheduledOrders] Backend unavailable, storing locally");
          const localId = addLocalOrder(orderData);
          return localId;
        }

        return response.data?.createScheduledOrder?.documentId;
      } catch (err) {
        // Fallback to local store
        console.warn("[ScheduledOrders] Error, storing locally:", err);
        const localId = addLocalOrder(orderData);
        return localId;
      }
    },
    [executeMutation, addLocalOrder]
  );

  return {
    createOrder,
    loading: result.fetching,
    error: result.error?.message || null,
  };
}

/**
 * Update scheduled order status
 */
export function useUpdateScheduledOrderStatus() {
  const [result, executeMutation] = useMutation(UPDATE_SCHEDULED_ORDER_STATUS);
  const updateLocalStatus = useScheduledOrdersStore((s) => s.updateOrderStatus);

  const updateStatus = React.useCallback(
    async (documentId: string, status: string) => {
      try {
        const response = await executeMutation({ documentId, status });

        if (response.error) {
          // Update local store as fallback
          updateLocalStatus(documentId, status as any);
        }

        return response.data?.updateScheduledOrder;
      } catch (err) {
        updateLocalStatus(documentId, status as any);
        throw err;
      }
    },
    [executeMutation, updateLocalStatus]
  );

  return {
    updateStatus,
    loading: result.fetching,
    error: result.error?.message || null,
  };
}

// ==========================================
// RESERVATIONS HOOKS
// ==========================================

/**
 * Fetch reservations for a specific date
 */
export function useReservationsForDate(date: string) {
  const [result, reexecuteQuery] = useQuery({
    query: GET_RESERVATIONS_FOR_DATE,
    variables: { date },
    pause: !date,
  });

  const reservations = React.useMemo(() => {
    return result.data?.reservations?.map(transformReservation) || [];
  }, [result.data]);

  return {
    reservations,
    isLoading: result.fetching,
    error: result.error?.message || null,
    refetch: () => reexecuteQuery({ requestPolicy: "network-only" }),
  };
}

/**
 * Fetch upcoming reservations
 */
export function useUpcomingReservations(limit: number = 20) {
  const today = new Date().toISOString().split("T")[0];

  const [result, reexecuteQuery] = useQuery({
    query: GET_UPCOMING_RESERVATIONS,
    variables: { fromDate: today, limit },
  });

  const reservations = React.useMemo(() => {
    return result.data?.reservations?.map(transformReservation) || [];
  }, [result.data]);

  return {
    reservations,
    isLoading: result.fetching,
    error: result.error?.message || null,
    refetch: () => reexecuteQuery({ requestPolicy: "network-only" }),
  };
}

/**
 * Create a new reservation
 */
export function useCreateReservation() {
  const [result, executeMutation] = useMutation(CREATE_RESERVATION);

  const createReservation = React.useCallback(
    async (data: {
      tableId: string;
      date: string;
      startTime: string;
      endTime: string;
      guestCount: number;
      contactName: string;
      contactPhone: string;
      contactEmail?: string;
      notes?: string;
      specialRequests?: string;
      occasion?: string;
    }) => {
      // Generate confirmation code
      const confirmationCode = `R${Date.now().toString(36).toUpperCase()}`;

      const response = await executeMutation({
        data: {
          table: data.tableId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          guestCount: data.guestCount,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          notes: data.notes,
          specialRequests: data.specialRequests,
          occasion: data.occasion,
          confirmationCode,
          status: "pending",
          source: "app",
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data?.createReservation;
    },
    [executeMutation]
  );

  return {
    createReservation,
    loading: result.fetching,
    error: result.error?.message || null,
  };
}

/**
 * Update reservation status
 */
export function useUpdateReservationStatus() {
  const [result, executeMutation] = useMutation(UPDATE_RESERVATION_STATUS);

  const updateStatus = React.useCallback(
    async (documentId: string, status: string) => {
      const response = await executeMutation({ documentId, status });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data?.updateReservation;
    },
    [executeMutation]
  );

  return {
    updateStatus,
    loading: result.fetching,
    error: result.error?.message || null,
  };
}
