"use client";

import * as React from "react";
import { useTicketsStore } from "@/stores/tickets-store";
import { wsManager } from "@/lib/ws";
import { kitchenApi } from "@/lib/api";
import type { KitchenTicket, TicketStatus, WSEvent } from "@/types";

export function useKitchenTickets() {
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

  // Load initial tickets
  React.useEffect(() => {
    const loadTickets = async () => {
      const response = await kitchenApi.getTickets();
      if (response.success) {
        setTickets(response.data);
      }
    };
    loadTickets();
  }, [setTickets]);

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

  // Status change handler with optimistic update
  const handleStatusChange = React.useCallback(
    async (ticketId: string, status: TicketStatus) => {
      // Optimistic update
      updateTicketStatus(ticketId, status);

      // API call
      const response = await kitchenApi.updateTicketStatus(ticketId, status);

      if (!response.success) {
        // Revert on failure - would need to store previous state
        console.error("Failed to update ticket status");
      }
    },
    [updateTicketStatus]
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
    counts,
    setFilter,
    handleStatusChange,
    newTicketsCount: getNewTicketsCount(),
  };
}
