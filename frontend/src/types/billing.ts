/**
 * Billing Domain Types
 *
 * Types for bill splitting and payment processing.
 */

// ==========================================
// BILL SPLITTING
// ==========================================

export type SplitMode = "even" | "by_items" | "mixed";
export type BillStatus = "draft" | "confirmed" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "card" | "paylater";

export interface AssignedItem {
  itemDocumentId: string;
  itemSlug: string;
  portion: number; // 0-1
}

export interface SplitParticipant {
  personId: string;
  name?: string;
  share: number; // 0-100 percentage
  assignedItems: AssignedItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
}

export interface SplitTotals {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  unassigned: number;
}

export interface BillSplit {
  documentId: string;
  slug: string;
  orderId: string;
  mode: SplitMode;
  participants: SplitParticipant[];
  totals: SplitTotals;
  createdAt: string;
  createdBy: string;
  status: BillStatus;
}
