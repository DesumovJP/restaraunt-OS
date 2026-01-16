import { create } from "zustand";

export interface ScheduledOrderModeContext {
  isScheduledMode: boolean;
  reservationId: string | null;
  reservationCode: string | null;
  tableId: string | null;
  tableNumber: number | null;
  scheduledFor: string | null; // ISO datetime
  contactName: string | null;
  contactPhone: string | null;
  guestCount: number | null;
}

export interface ScheduledOrderModeStore extends ScheduledOrderModeContext {
  // Actions
  enterScheduledMode: (context: Omit<ScheduledOrderModeContext, 'isScheduledMode'>) => void;
  exitScheduledMode: () => void;

  // Getters
  getFormattedDateTime: () => string;
}

const initialState: ScheduledOrderModeContext = {
  isScheduledMode: false,
  reservationId: null,
  reservationCode: null,
  tableId: null,
  tableNumber: null,
  scheduledFor: null,
  contactName: null,
  contactPhone: null,
  guestCount: null,
};

export const useScheduledOrderModeStore = create<ScheduledOrderModeStore>((set, get) => ({
  ...initialState,

  enterScheduledMode: (context) => {
    set({
      isScheduledMode: true,
      ...context,
    });
  },

  exitScheduledMode: () => {
    set(initialState);
  },

  getFormattedDateTime: () => {
    const { scheduledFor } = get();
    if (!scheduledFor) return "";

    const date = new Date(scheduledFor);
    const day = date.toLocaleDateString("uk-UA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const time = date.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${day}, ${time}`;
  },
}));
