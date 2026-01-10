/**
 * Kitchen Hooks
 * Hooks for kitchen ticket operations using GraphQL (queries) and REST (mutations)
 *
 * @description Provides hooks for kitchen queue management with real-time updates
 * @module hooks/use-graphql-kitchen
 */

'use client';

import { useQuery } from 'urql';
import { useState, useCallback } from 'react';
import { useTicketsStore } from '@/stores/tickets-store';
import { GET_KITCHEN_QUEUE } from '@/graphql/queries';
import { authFetch } from '@/stores/auth-store';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// ============================================
// LOGGING UTILITIES
// ============================================

const LOG_PREFIX = '[Kitchen]';
const LOG_COLORS = {
  info: 'color: #3B82F6',
  success: 'color: #10B981',
  error: 'color: #EF4444',
  warn: 'color: #F59E0B',
  action: 'color: #8B5CF6',
};

interface LogContext {
  ticketId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

function logKitchen(
  level: keyof typeof LOG_COLORS,
  message: string,
  context?: LogContext
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

interface TicketActionResult {
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
 * Helper function to make REST API calls to Strapi
 * Includes comprehensive logging for debugging
 */
async function kitchenTicketAction(
  documentId: string,
  action: 'start' | 'complete' | 'pause' | 'resume' | 'cancel' | 'fail' | 'serve',
  body?: Record<string, any>
): Promise<TicketActionResult> {
  const startTime = performance.now();
  const url = `${STRAPI_URL}/api/kitchen-tickets/${documentId}/${action}`;

  logKitchen('action', `→ ${action.toUpperCase()} ticket`, {
    ticketId: documentId,
    action,
    url,
    body,
  });

  try {
    const response = await authFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const duration = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logKitchen('error', `✗ ${action.toUpperCase()} failed`, {
        ticketId: documentId,
        action,
        status: response.status,
        duration,
        error: errorData,
      });
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.error?.message || `Failed to ${action} ticket`,
          details: errorData,
        },
      };
    }

    const data = await response.json();

    logKitchen('success', `✓ ${action.toUpperCase()} completed`, {
      ticketId: documentId,
      action,
      duration,
      newStatus: data.ticket?.status,
      consumedBatches: data.consumedBatches?.length,
    });

    return data;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    const errorMessage = err instanceof Error ? err.message : `Failed to ${action} ticket`;

    logKitchen('error', `✗ ${action.toUpperCase()} network error`, {
      ticketId: documentId,
      action,
      duration,
      error: errorMessage,
    });

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: errorMessage,
      },
    };
  }
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
      statuses: ['queued', 'started', 'paused', 'resumed', 'ready']
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

  // Log queue updates
  if (data && !fetching) {
    logKitchen('info', `Queue loaded: ${tickets.length} tickets`, {
      station: station || 'all',
      counts,
    });
  }

  if (error) {
    logKitchen('error', 'Failed to load queue', { error: error.message });
  }

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
 * Uses REST API: POST /api/kitchen-tickets/:documentId/start
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const { startTicket, loading } = useStartTicket();
 * const result = await startTicket('ticket-doc-id');
 * if (result.success) {
 *   console.log('Ticket started:', result.ticket);
 *   console.log('Consumed batches:', result.consumedBatches);
 * }
 * ```
 */
export function useStartTicket() {
  const [loading, setLoading] = useState(false);

  const startTicket = useCallback(async (documentId: string): Promise<TicketActionResult> => {
    setLoading(true);
    try {
      const result = await kitchenTicketAction(documentId, 'start');
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { startTicket, loading };
}

/**
 * Hook for completing a kitchen ticket
 * Uses REST API: POST /api/kitchen-tickets/:documentId/complete
 */
export function useCompleteTicket() {
  const [loading, setLoading] = useState(false);

  const completeTicket = useCallback(async (documentId: string): Promise<TicketActionResult> => {
    setLoading(true);
    try {
      const result = await kitchenTicketAction(documentId, 'complete');
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to complete ticket');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { completeTicket, loading };
}

/**
 * Hook for pausing a kitchen ticket
 * Uses REST API: POST /api/kitchen-tickets/:documentId/pause
 */
export function usePauseTicket() {
  const [loading, setLoading] = useState(false);

  const pauseTicket = useCallback(async (documentId: string, reason?: string): Promise<TicketActionResult> => {
    setLoading(true);
    try {
      const result = await kitchenTicketAction(documentId, 'pause', { reason });
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to pause ticket');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { pauseTicket, loading };
}

/**
 * Hook for resuming a paused kitchen ticket
 * Uses REST API: POST /api/kitchen-tickets/:documentId/resume
 */
export function useResumeTicket() {
  const [loading, setLoading] = useState(false);

  const resumeTicket = useCallback(async (documentId: string): Promise<TicketActionResult> => {
    setLoading(true);
    try {
      const result = await kitchenTicketAction(documentId, 'resume');
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to resume ticket');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { resumeTicket, loading };
}

/**
 * Hook for cancelling a kitchen ticket (releases inventory)
 * Uses REST API: POST /api/kitchen-tickets/:documentId/cancel
 */
export function useCancelTicket() {
  const [loading, setLoading] = useState(false);

  const cancelTicket = useCallback(async (documentId: string, reason?: string): Promise<TicketActionResult> => {
    setLoading(true);
    try {
      const result = await kitchenTicketAction(documentId, 'cancel', { reason });
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to cancel ticket');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { cancelTicket, loading };
}

/**
 * Hook for failing a kitchen ticket (releases inventory)
 * Uses REST API: POST /api/kitchen-tickets/:documentId/fail
 */
export function useFailTicket() {
  const [loading, setLoading] = useState(false);

  const failTicket = useCallback(async (documentId: string, reason?: string): Promise<TicketActionResult> => {
    setLoading(true);
    try {
      const result = await kitchenTicketAction(documentId, 'fail', { reason });
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fail ticket');
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { failTicket, loading };
}

/**
 * Hook for serving a kitchen ticket (marking dish as picked up by waiter)
 * Uses REST API: POST /api/kitchen-tickets/:documentId/serve
 */
export function useServeTicket() {
  const [loading, setLoading] = useState(false);

  const serveTicket = useCallback(async (documentId: string): Promise<TicketActionResult> => {
    setLoading(true);
    try {
      const result = await kitchenTicketAction(documentId, 'serve');
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { serveTicket, loading };
}
