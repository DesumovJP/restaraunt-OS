"use client";

import * as React from "react";
import { useTicketsStore } from "@/stores/tickets-store";
import { wsManager } from "@/lib/ws";
import { kitchenApi } from "@/lib/api";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import type { KitchenTicket, TicketStatus, WSEvent } from "@/types";

/**
 * Kitchen Tickets Hook
 *
 * Manages kitchen ticket data with real-time updates via WebSocket.
 * Provides ticket filtering, status updates, and timer tracking.
 *
 * Features:
 * - Automatic data fetching with retry logic (3 attempts, exponential backoff)
 * - Real-time updates via WebSocket
 * - Optimistic updates for status changes with rollback on error
 * - Timer tracking for active tickets
 * - Sound notifications for new tickets
 *
 * @returns {UseKitchenTicketsReturn} Ticket state and controls
 *
 * @example
 * function KitchenDisplay() {
 *   const {
 *     tickets,
 *     isLoading,
 *     error,
 *     handleStatusChange,
 *     refetch
 *   } = useKitchenTickets();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorFallback error={error} onRetry={refetch} />;
 *
 *   return (
 *     <div>
 *       {tickets.map(ticket => (
 *         <TicketCard
 *           key={ticket.id}
 *           ticket={ticket}
 *           onStatusChange={handleStatusChange}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 *
 * @example Response
 * {
 *   tickets: [
 *     {
 *       id: "ticket-123",
 *       tableNumber: 5,
 *       items: [...],
 *       status: "new",
 *       createdAt: "2024-01-15T10:30:00Z",
 *       elapsedSeconds: 120
 *     }
 *   ],
 *   filter: "all",
 *   isConnected: true,
 *   isLoading: false,
 *   error: null,
 *   counts: { all: 10, new: 3, in_progress: 5, ready: 2 }
 * }
 */

export interface UseKitchenTicketsReturn {
  /** Filtered list of tickets based on current filter */
  tickets: KitchenTicket[];
  /** Current filter value */
  filter: TicketStatus | "all";
  /** WebSocket connection status */
  isConnected: boolean;
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Error from last fetch attempt */
  error: Error | null;
  /** Ticket counts by status */
  counts: {
    all: number;
    new: number;
    in_progress: number;
    ready: number;
  };
  /** Update filter */
  setFilter: (filter: TicketStatus | "all") => void;
  /** Update ticket status with optimistic update */
  handleStatusChange: (ticketId: string, status: TicketStatus) => Promise<void>;
  /** Count of new tickets (for badges) */
  newTicketsCount: number;
  /** Manually refetch tickets */
  refetch: () => Promise<void>;
}

export function useKitchenTickets(): UseKitchenTicketsReturn {
  const {
    tickets,
    filter,
    isConnected,
    setTickets,
    addTicket,
    updateTicketStatus,
    updateTicketTimer,
    setFilter,
    setConnected,
    getFilteredTickets,
    getTicketsByStatus,
    getNewTicketsCount,
  } = useTicketsStore();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Store previous status for rollback
  const previousStatusRef = React.useRef<Map<string, TicketStatus>>(new Map());

  /**
   * Fetch tickets with retry logic
   */
  const loadTickets = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithRetry(
        async () => {
          const result = await kitchenApi.getTickets();
          if (!result.success) {
            throw new Error(result.message || "Не вдалося завантажити тікети");
          }
          return result;
        },
        {
          maxRetries: 3,
          onRetry: (attempt, err) => {
            console.warn(`Retry ${attempt} for loadTickets:`, err.message);
          },
        }
      );

      setTickets(response.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Невідома помилка");
      setError(error);
      console.error("Failed to load tickets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setTickets]);

  // Load initial tickets
  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // WebSocket connection
  React.useEffect(() => {
    wsManager.connect();
    setConnected(true);

    // Subscribe to new tickets
    const unsubNew = wsManager.subscribe("ticket:new", (event: WSEvent) => {
      const newTicket = event.payload as KitchenTicket;
      addTicket(newTicket);

      // Play notification sound (if available)
      if (typeof window !== "undefined" && "Audio" in window) {
        const audio = new Audio("/sounds/new-order.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Autoplay blocked - ignore
        });
      }
    });

    // Subscribe to ticket updates
    const unsubUpdate = wsManager.subscribe("ticket:update", (event: WSEvent) => {
      const { ticketId, status } = event.payload as {
        ticketId: string;
        status: TicketStatus;
      };
      updateTicketStatus(ticketId, status);
    });

    return () => {
      unsubNew();
      unsubUpdate();
      wsManager.disconnect();
      setConnected(false);
    };
  }, [setConnected, addTicket, updateTicketStatus]);

  // Timer updates - run every second for active tickets
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      const activeTickets = tickets.filter(
        (t) => t.status === "new" || t.status === "in_progress"
      );

      activeTickets.forEach((ticket) => {
        const createdAt = new Date(ticket.createdAt).getTime();
        const now = Date.now();
        const newElapsed = Math.floor((now - createdAt) / 1000);
        if (newElapsed !== ticket.elapsedSeconds) {
          updateTicketTimer(ticket.id, newElapsed);
        }
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [tickets, updateTicketTimer]);

  /**
   * Update ticket status with optimistic update and rollback on error
   */
  const handleStatusChange = React.useCallback(
    async (ticketId: string, status: TicketStatus) => {
      // Find current ticket to store previous status
      const currentTicket = tickets.find((t) => t.id === ticketId);
      if (currentTicket) {
        previousStatusRef.current.set(ticketId, currentTicket.status);
      }

      // Optimistic update
      updateTicketStatus(ticketId, status);

      try {
        const response = await fetchWithRetry(
          async () => {
            const result = await kitchenApi.updateTicketStatus(ticketId, status);
            if (!result.success) {
              throw new Error(result.message || "Не вдалося оновити статус");
            }
            return result;
          },
          {
            maxRetries: 2,
            baseDelayMs: 500,
          }
        );

        // Clear stored status on success
        previousStatusRef.current.delete(ticketId);
      } catch (err) {
        // Rollback on error
        const previousStatus = previousStatusRef.current.get(ticketId);
        if (previousStatus) {
          updateTicketStatus(ticketId, previousStatus);
          previousStatusRef.current.delete(ticketId);
        }

        console.error("Failed to update ticket status:", err);
        throw err;
      }
    },
    [tickets, updateTicketStatus]
  );

  // Computed values
  const filteredTickets = getFilteredTickets();
  const counts = {
    all: tickets.length,
    new: getTicketsByStatus("new").length,
    in_progress: getTicketsByStatus("in_progress").length,
    ready: getTicketsByStatus("ready").length,
  };

  return {
    tickets: filteredTickets,
    filter,
    isConnected,
    isLoading,
    error,
    counts,
    setFilter,
    handleStatusChange,
    newTicketsCount: getNewTicketsCount(),
    refetch: loadTickets,
  };
}
