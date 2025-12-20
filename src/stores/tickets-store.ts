import { create } from "zustand";
import type { KitchenTicket, TicketStatus } from "@/types";

interface TicketsState {
  tickets: KitchenTicket[];
  filter: TicketStatus | "all";
  isConnected: boolean;

  // Actions
  setTickets: (tickets: KitchenTicket[]) => void;
  addTicket: (ticket: KitchenTicket) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  updateTicketTimer: (ticketId: string, elapsedSeconds: number) => void;
  setFilter: (filter: TicketStatus | "all") => void;
  setConnected: (connected: boolean) => void;

  // Computed
  getFilteredTickets: () => KitchenTicket[];
  getTicketsByStatus: (status: TicketStatus) => KitchenTicket[];
  getNewTicketsCount: () => number;
}

export const useTicketsStore = create<TicketsState>()((set, get) => ({
  tickets: [],
  filter: "all",
  isConnected: false,

  setTickets: (tickets) => {
    set({ tickets });
  },

  addTicket: (ticket) => {
    set((state) => ({
      tickets: [ticket, ...state.tickets],
    }));
  },

  updateTicketStatus: (ticketId, status) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
              startedAt: status === "in_progress" ? new Date() : ticket.startedAt,
              completedAt: status === "ready" ? new Date() : ticket.completedAt,
            }
          : ticket
      ),
    }));
  },

  updateTicketTimer: (ticketId, elapsedSeconds) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, elapsedSeconds } : ticket
      ),
    }));
  },

  setFilter: (filter) => {
    set({ filter });
  },

  setConnected: (connected) => {
    set({ isConnected: connected });
  },

  getFilteredTickets: () => {
    const { tickets, filter } = get();
    if (filter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === filter);
  },

  getTicketsByStatus: (status) => {
    return get().tickets.filter((ticket) => ticket.status === status);
  },

  getNewTicketsCount: () => {
    return get().tickets.filter((ticket) => ticket.status === "new").length;
  },
}));
