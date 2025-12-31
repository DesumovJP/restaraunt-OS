/**
 * Kitchen GraphQL Hooks
 * Hooks for kitchen ticket operations using urql
 *
 * @description Provides hooks for kitchen queue management with real-time updates
 * @module hooks/use-graphql-kitchen
 */

'use client';

import { useQuery, useMutation, useCallback } from 'urql';
import { useTicketsStore } from '@/stores/tickets-store';
import { GET_KITCHEN_QUEUE } from '@/graphql/queries';
import {
  START_KITCHEN_TICKET,
  COMPLETE_KITCHEN_TICKET,
  PAUSE_KITCHEN_TICKET,
  RESUME_KITCHEN_TICKET,
  CANCEL_KITCHEN_TICKET
} from '@/graphql/mutations';

// Types
interface KitchenTicket {
  documentId: string;
  ticketNumber: string;
  status: string;
  station: string;
  priority: string;
  priorityScore: number;
  startedAt: string | null;
  completedAt: string | null;
  elapsedSeconds: number;
  inventoryLocked: boolean;
  createdAt: string;
  assignedChef?: {
    documentId: string;
    username: string;
  };
  orderItem?: {
    documentId: string;
    quantity: number;
    notes: string | null;
    modifiers: any[];
    menuItem: {
      documentId: string;
      name: string;
      price: number;
      preparationTime: number;
      image?: { url: string };
    };
  };
  order?: {
    documentId: string;
    orderNumber: string;
    table: {
      documentId: string;
      number: number;
    };
  };
}

interface StartTicketResult {
  success: boolean;
  ticket?: KitchenTicket;
  consumedBatches?: Array<{
    batchDocumentId: string;
    ingredientDocumentId: string;
    grossQuantity: number;
    netQuantity: number;
    cost: number;
  }>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Hook for fetching and managing kitchen queue
 *
 * @param station - Optional station filter (e.g., 'grill', 'hot', 'bar')
 * @returns Kitchen queue data and operations
 *
 * @example
 * ```tsx
 * const { tickets, loading, error, refetch } = useKitchenQueue('hot');
 * ```
 */
export function useKitchenQueue(station?: string) {
  const setTickets = useTicketsStore((state) => state.setTickets);
  const storeTickets = useTicketsStore((state) => state.tickets);

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: GET_KITCHEN_QUEUE,
    variables: {
      station: station || undefined,
      statuses: ['queued', 'started', 'paused', 'resumed']
    },
    requestPolicy: 'cache-and-network',
  });

  // Transform and update store when data changes
  const tickets: KitchenTicket[] = data?.kitchenTickets || [];

  // Computed counts
  const counts = {
    all: tickets.length,
    queued: tickets.filter(t => t.status === 'queued').length,
    started: tickets.filter(t => ['started', 'resumed'].includes(t.status)).length,
    paused: tickets.filter(t => t.status === 'paused').length,
  };

  return {
    tickets,
    loading: fetching,
    error: error?.message,
    counts,
    refetch: reexecuteQuery,
  };
}

/**
 * Hook for starting a kitchen ticket (triggers inventory deduction)
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const { startTicket, loading } = useStartTicket();
 * const result = await startTicket('ticket-doc-id');
 * if (result.success) {
 *   console.log('Ticket started:', result.ticket);
 * }
 * ```
 */
export function useStartTicket() {
  const [{ fetching }, executeMutation] = useMutation(START_KITCHEN_TICKET);

  const startTicket = useCallback(async (documentId: string): Promise<StartTicketResult> => {
    const result = await executeMutation({ documentId });

    if (result.error) {
      return {
        success: false,
        error: {
          code: 'MUTATION_ERROR',
          message: result.error.message,
        },
      };
    }

    const data = result.data?.startKitchenTicket;

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to start ticket',
        },
      };
    }

    return {
      success: true,
      ticket: data.ticket,
      consumedBatches: data.consumedBatches,
    };
  }, [executeMutation]);

  return { startTicket, loading: fetching };
}

/**
 * Hook for completing a kitchen ticket
 */
export function useCompleteTicket() {
  const [{ fetching }, executeMutation] = useMutation(COMPLETE_KITCHEN_TICKET);

  const completeTicket = useCallback(async (documentId: string) => {
    const result = await executeMutation({ documentId });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data?.completeKitchenTicket?.success) {
      throw new Error(
        result.data?.completeKitchenTicket?.error?.message || 'Failed to complete ticket'
      );
    }

    return result.data.completeKitchenTicket;
  }, [executeMutation]);

  return { completeTicket, loading: fetching };
}

/**
 * Hook for pausing a kitchen ticket
 */
export function usePauseTicket() {
  const [{ fetching }, executeMutation] = useMutation(PAUSE_KITCHEN_TICKET);

  const pauseTicket = useCallback(async (documentId: string, reason?: string) => {
    const result = await executeMutation({ documentId, reason });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data?.pauseKitchenTicket?.success) {
      throw new Error(
        result.data?.pauseKitchenTicket?.error?.message || 'Failed to pause ticket'
      );
    }

    return result.data.pauseKitchenTicket;
  }, [executeMutation]);

  return { pauseTicket, loading: fetching };
}

/**
 * Hook for resuming a paused kitchen ticket
 */
export function useResumeTicket() {
  const [{ fetching }, executeMutation] = useMutation(RESUME_KITCHEN_TICKET);

  const resumeTicket = useCallback(async (documentId: string) => {
    const result = await executeMutation({ documentId });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data?.resumeKitchenTicket?.success) {
      throw new Error(
        result.data?.resumeKitchenTicket?.error?.message || 'Failed to resume ticket'
      );
    }

    return result.data.resumeKitchenTicket;
  }, [executeMutation]);

  return { resumeTicket, loading: fetching };
}

/**
 * Hook for cancelling a kitchen ticket (releases inventory)
 */
export function useCancelTicket() {
  const [{ fetching }, executeMutation] = useMutation(CANCEL_KITCHEN_TICKET);

  const cancelTicket = useCallback(async (documentId: string, reason?: string) => {
    const result = await executeMutation({ documentId, reason });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data?.cancelKitchenTicket?.success) {
      throw new Error(
        result.data?.cancelKitchenTicket?.error?.message || 'Failed to cancel ticket'
      );
    }

    return result.data.cancelKitchenTicket;
  }, [executeMutation]);

  return { cancelTicket, loading: fetching };
}
