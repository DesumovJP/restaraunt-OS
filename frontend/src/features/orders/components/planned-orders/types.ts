/**
 * Planned Orders Types
 *
 * Type definitions for planned orders view
 */

import type {
  EventType,
  SeatingArea,
  MenuPreset,
  PaymentStatus,
  ChecklistItem,
} from "@/stores/scheduled-orders-store";

// ==========================================
// VIEW MODEL INTERFACES
// ==========================================

export interface PlannedOrderItem {
  id: string;
  menuItemName: string;
  quantity: number;
  notes?: string;
  station?: string;
}

export interface PlannedOrder {
  id: string;
  tableNumber: number;
  scheduledTime: Date;
  prepStartTime: Date;
  guestCount: number;
  items: PlannedOrderItem[];
  status: "scheduled" | "activating" | "activated" | "completed";
  specialRequests?: string;
  createdBy: string;
  priority?: "normal" | "vip";
  // HoReCa extensions
  eventType?: EventType;
  eventName?: string;
  seatingArea?: SeatingArea;
  contact?: { name: string; phone: string; email?: string; company?: string };
  paymentStatus?: PaymentStatus;
  depositAmount?: number;
  totalAmount?: number;
  adultsCount?: number;
  childrenCount?: number;
  menuPreset?: MenuPreset;
  assignedCoordinator?: string;
  checklist?: ChecklistItem[];
  decorations?: string;
  cakeDetails?: string;
}

// ==========================================
// COMPONENT PROPS
// ==========================================

export interface PlannedOrdersViewProps {
  variant?: "kitchen" | "waiter";
  className?: string;
}

export interface OrderCardProps {
  order: PlannedOrder;
  variant: "kitchen" | "waiter";
  isExpanded: boolean;
  onToggleExpand: () => void;
  onActivate?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
}

export interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  selectedDate?: Date;
}

export interface ViewDialogProps {
  order: PlannedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface DateSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  variant: "kitchen" | "waiter";
  getOrdersForDate: (dateStr: string) => any[];
}

export interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  variant: "kitchen" | "waiter";
  stats: {
    total: number;
    scheduled: number;
    activated: number;
    completed: number;
  };
}

// ==========================================
// FORM DATA
// ==========================================

export interface CreateOrderFormData {
  tableNumber: string;
  date: string;
  time: string;
  prepTime: string;
  notes: string;
  guestCount: string;
  adultsCount: string;
  childrenCount: string;
  eventType: EventType;
  eventName: string;
  seatingArea: SeatingArea;
  menuPreset: MenuPreset;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactCompany: string;
  depositAmount: string;
  decorations: string;
  cakeDetails: string;
  assignedCoordinator: string;
}

// ==========================================
// TIME DISPLAY
// ==========================================

export interface TimeDisplayInfo {
  time: string;
  relative: string;
  isOverdue: boolean;
}
