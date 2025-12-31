/**
 * Bill Split Calculator Utilities
 *
 * Handles even splits, by-item splits, and mixed mode splits
 * with proper tax and tip distribution.
 */

import type {
  BillSplit,
  SplitMode,
  SplitParticipant,
  SplitTotals,
  AssignedItem,
  ExtendedOrderItem,
} from '@/types/extended';

// ==========================================
// CONFIGURATION
// ==========================================

const DEFAULT_TAX_RATE = 0.1; // 10%
const DEFAULT_TIP_PERCENT = 0; // No default tip

// ==========================================
// EVEN SPLIT CALCULATION
// ==========================================

/**
 * Split bill evenly among participants
 *
 * Handles rounding by assigning remainder to first participant
 *
 * @example
 * calculateEvenSplit(100, 3, 0.1, 10)
 * // Returns: [36.67, 36.67, 36.66] with tax and tip
 */
export function calculateEvenSplit(
  subtotal: number,
  participantCount: number,
  taxRate: number = DEFAULT_TAX_RATE,
  tipPercent: number = DEFAULT_TIP_PERCENT
): {
  perPerson: number;
  remainder: number;
  tax: number;
  tip: number;
  total: number;
} {
  if (participantCount <= 0) {
    throw new Error('Participant count must be greater than 0');
  }

  const tax = roundCurrency(subtotal * taxRate);
  const tip = roundCurrency(subtotal * (tipPercent / 100));
  const total = subtotal + tax + tip;

  const perPerson = Math.floor((total / participantCount) * 100) / 100;
  const sumOfShares = perPerson * participantCount;
  const remainder = roundCurrency(total - sumOfShares);

  return {
    perPerson,
    remainder,
    tax: roundCurrency(tax / participantCount),
    tip: roundCurrency(tip / participantCount),
    total,
  };
}

/**
 * Create participants for even split
 */
export function createEvenSplitParticipants(
  participantCount: number,
  subtotal: number,
  taxRate: number = DEFAULT_TAX_RATE,
  tipPercent: number = DEFAULT_TIP_PERCENT
): SplitParticipant[] {
  const split = calculateEvenSplit(subtotal, participantCount, taxRate, tipPercent);
  const participants: SplitParticipant[] = [];

  for (let i = 0; i < participantCount; i++) {
    const isFirst = i === 0;
    const personSubtotal = roundCurrency(subtotal / participantCount);
    const personTax = roundCurrency(personSubtotal * taxRate);
    const personTip = roundCurrency(personSubtotal * (tipPercent / 100));

    participants.push({
      personId: `guest_${i + 1}`,
      name: `Гість ${i + 1}`,
      share: roundCurrency(100 / participantCount),
      assignedItems: [],
      subtotal: personSubtotal,
      tax: personTax,
      tip: personTip,
      // Add remainder to first person
      total: split.perPerson + (isFirst ? split.remainder : 0),
    });
  }

  return participants;
}

// ==========================================
// BY-ITEMS SPLIT CALCULATION
// ==========================================

/**
 * Calculate split based on assigned items
 */
export function calculateByItemsSplit(
  items: ExtendedOrderItem[],
  assignments: Map<string, AssignedItem[]>, // personId -> items
  taxRate: number = DEFAULT_TAX_RATE,
  tipPercent: number = DEFAULT_TIP_PERCENT
): Map<string, { subtotal: number; tax: number; tip: number; total: number }> {
  const result = new Map<
    string,
    { subtotal: number; tax: number; tip: number; total: number }
  >();

  for (const [personId, assignedItems] of assignments) {
    let subtotal = 0;

    for (const assigned of assignedItems) {
      const item = items.find((i) => i.documentId === assigned.itemDocumentId);
      if (item) {
        const itemTotal = item.menuItem.price * item.quantity;
        subtotal += itemTotal * assigned.portion;
      }
    }

    subtotal = roundCurrency(subtotal);
    const tax = roundCurrency(subtotal * taxRate);
    const tip = roundCurrency(subtotal * (tipPercent / 100));

    result.set(personId, {
      subtotal,
      tax,
      tip,
      total: roundCurrency(subtotal + tax + tip),
    });
  }

  return result;
}

/**
 * Create participants for by-items split
 */
export function createByItemsSplitParticipants(
  items: ExtendedOrderItem[],
  assignments: Array<{
    personId: string;
    name?: string;
    items: Array<{ itemDocumentId: string; itemSlug: string; portion: number }>;
  }>,
  taxRate: number = DEFAULT_TAX_RATE,
  tipPercent: number = DEFAULT_TIP_PERCENT
): SplitParticipant[] {
  const assignmentMap = new Map<string, AssignedItem[]>();

  for (const assignment of assignments) {
    assignmentMap.set(assignment.personId, assignment.items);
  }

  const calculations = calculateByItemsSplit(items, assignmentMap, taxRate, tipPercent);
  const participants: SplitParticipant[] = [];

  for (const assignment of assignments) {
    const calc = calculations.get(assignment.personId);
    if (calc) {
      participants.push({
        personId: assignment.personId,
        name: assignment.name,
        share: 0, // Not applicable for by-items mode
        assignedItems: assignment.items,
        subtotal: calc.subtotal,
        tax: calc.tax,
        tip: calc.tip,
        total: calc.total,
      });
    }
  }

  return participants;
}

// ==========================================
// MIXED SPLIT CALCULATION
// ==========================================

/**
 * Calculate mixed split (percentage shares + specific items)
 *
 * Items assigned to specific people are subtracted from the pool,
 * then the remainder is split by percentage shares.
 */
export function calculateMixedSplit(
  items: ExtendedOrderItem[],
  participants: Array<{
    personId: string;
    name?: string;
    sharePercent: number; // Percentage of unassigned items
    specificItems: AssignedItem[];
  }>,
  taxRate: number = DEFAULT_TAX_RATE,
  tipPercent: number = DEFAULT_TIP_PERCENT
): SplitParticipant[] {
  // Calculate total order value
  const totalSubtotal = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  // Calculate value of specifically assigned items per person
  const specificTotals = new Map<string, number>();
  const assignedItemIds = new Set<string>();

  for (const participant of participants) {
    let personSpecificTotal = 0;

    for (const assigned of participant.specificItems) {
      const item = items.find((i) => i.documentId === assigned.itemDocumentId);
      if (item) {
        const itemValue = item.menuItem.price * item.quantity * assigned.portion;
        personSpecificTotal += itemValue;
        assignedItemIds.add(assigned.itemDocumentId);
      }
    }

    specificTotals.set(participant.personId, roundCurrency(personSpecificTotal));
  }

  // Calculate unassigned pool
  let unassignedPool = 0;
  for (const item of items) {
    if (!assignedItemIds.has(item.documentId)) {
      unassignedPool += item.menuItem.price * item.quantity;
    }
  }

  // Partially assigned items: subtract the assigned portion
  for (const participant of participants) {
    for (const assigned of participant.specificItems) {
      if (assigned.portion < 1) {
        const item = items.find((i) => i.documentId === assigned.itemDocumentId);
        if (item) {
          // Add unassigned portion back to pool
          unassignedPool += item.menuItem.price * item.quantity * (1 - assigned.portion);
        }
      }
    }
  }

  // Calculate each person's total
  const result: SplitParticipant[] = [];

  for (const participant of participants) {
    const specificAmount = specificTotals.get(participant.personId) || 0;
    const sharedAmount = roundCurrency(unassignedPool * (participant.sharePercent / 100));
    const subtotal = roundCurrency(specificAmount + sharedAmount);
    const tax = roundCurrency(subtotal * taxRate);
    const tip = roundCurrency(subtotal * (tipPercent / 100));

    result.push({
      personId: participant.personId,
      name: participant.name,
      share: participant.sharePercent,
      assignedItems: participant.specificItems,
      subtotal,
      tax,
      tip,
      total: roundCurrency(subtotal + tax + tip),
    });
  }

  return result;
}

// ==========================================
// TOTALS CALCULATION
// ==========================================

/**
 * Calculate split totals from participants
 */
export function calculateSplitTotals(
  participants: SplitParticipant[],
  orderSubtotal: number
): SplitTotals {
  const totals = participants.reduce(
    (acc, p) => ({
      subtotal: acc.subtotal + p.subtotal,
      tax: acc.tax + p.tax,
      tip: acc.tip + p.tip,
      total: acc.total + p.total,
    }),
    { subtotal: 0, tax: 0, tip: 0, total: 0 }
  );

  const unassigned = roundCurrency(orderSubtotal - totals.subtotal);

  return {
    subtotal: roundCurrency(totals.subtotal),
    tax: roundCurrency(totals.tax),
    tip: roundCurrency(totals.tip),
    total: roundCurrency(totals.total),
    unassigned: Math.max(0, unassigned),
  };
}

// ==========================================
// BILL SPLIT BUILDER
// ==========================================

interface CreateBillSplitOptions {
  orderId: string;
  mode: SplitMode;
  items: ExtendedOrderItem[];
  participantCount?: number; // For even split
  assignments?: Array<{
    personId: string;
    name?: string;
    items?: AssignedItem[];
    sharePercent?: number;
  }>;
  taxRate?: number;
  tipPercent?: number;
  createdBy: string;
}

/**
 * Create a complete BillSplit object
 */
export function createBillSplit(options: CreateBillSplitOptions): Omit<BillSplit, 'documentId' | 'slug'> {
  const {
    orderId,
    mode,
    items,
    participantCount = 2,
    assignments = [],
    taxRate = DEFAULT_TAX_RATE,
    tipPercent = DEFAULT_TIP_PERCENT,
    createdBy,
  } = options;

  const orderSubtotal = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  let participants: SplitParticipant[];

  switch (mode) {
    case 'even':
      participants = createEvenSplitParticipants(
        participantCount,
        orderSubtotal,
        taxRate,
        tipPercent
      );
      break;

    case 'by_items':
      participants = createByItemsSplitParticipants(
        items,
        assignments.map((a) => ({
          personId: a.personId,
          name: a.name,
          items: a.items || [],
        })),
        taxRate,
        tipPercent
      );
      break;

    case 'mixed':
      participants = calculateMixedSplit(
        items,
        assignments.map((a) => ({
          personId: a.personId,
          name: a.name,
          sharePercent: a.sharePercent || 0,
          specificItems: a.items || [],
        })),
        taxRate,
        tipPercent
      );
      break;

    default:
      throw new Error(`Unknown split mode: ${mode}`);
  }

  const totals = calculateSplitTotals(participants, orderSubtotal);

  return {
    orderId,
    mode,
    participants,
    totals,
    createdAt: new Date().toISOString(),
    createdBy,
    status: 'draft',
  };
}

// ==========================================
// VALIDATION
// ==========================================

/**
 * Validate that all items are assigned
 */
export function validateItemsAssigned(
  items: ExtendedOrderItem[],
  participants: SplitParticipant[]
): { valid: boolean; unassignedItems: string[] } {
  const assignedItems = new Map<string, number>(); // itemId -> total portion

  for (const participant of participants) {
    for (const assigned of participant.assignedItems) {
      const current = assignedItems.get(assigned.itemDocumentId) || 0;
      assignedItems.set(assigned.itemDocumentId, current + assigned.portion);
    }
  }

  const unassignedItems: string[] = [];

  for (const item of items) {
    const assignedPortion = assignedItems.get(item.documentId) || 0;
    if (assignedPortion < 1) {
      unassignedItems.push(item.documentId);
    }
  }

  return {
    valid: unassignedItems.length === 0,
    unassignedItems,
  };
}

/**
 * Validate that percentages sum to 100
 */
export function validatePercentages(
  participants: Array<{ sharePercent: number }>
): { valid: boolean; total: number } {
  const total = participants.reduce((sum, p) => sum + p.sharePercent, 0);
  return {
    valid: Math.abs(total - 100) < 0.01,
    total,
  };
}

/**
 * Check if split is ready to confirm
 */
export function canConfirmSplit(
  split: BillSplit,
  items: ExtendedOrderItem[]
): { canConfirm: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check no unassigned amount
  if (split.totals.unassigned > 0.01) {
    errors.push(`₴${split.totals.unassigned.toFixed(2)} не розподілено`);
  }

  // For by_items mode, check all items assigned
  if (split.mode === 'by_items' || split.mode === 'mixed') {
    const validation = validateItemsAssigned(items, split.participants);
    if (!validation.valid) {
      errors.push(`${validation.unassignedItems.length} страв не призначено`);
    }
  }

  // Check at least 2 participants
  if (split.participants.length < 2) {
    errors.push('Потрібно мінімум 2 учасники');
  }

  return {
    canConfirm: errors.length === 0,
    errors,
  };
}

// ==========================================
// UTILITIES
// ==========================================

/**
 * Round to currency (2 decimal places)
 */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format currency for display
 */
export function formatSplitAmount(amount: number): string {
  return `₴${amount.toFixed(2)}`;
}

/**
 * Generate unique person ID
 */
export function generatePersonId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add new participant to split
 */
export function addParticipant(
  split: Omit<BillSplit, 'documentId' | 'slug'>,
  name?: string
): Omit<BillSplit, 'documentId' | 'slug'> {
  const newParticipant: SplitParticipant = {
    personId: generatePersonId(),
    name: name || `Гість ${split.participants.length + 1}`,
    share: 0,
    assignedItems: [],
    subtotal: 0,
    tax: 0,
    tip: 0,
    total: 0,
  };

  return {
    ...split,
    participants: [...split.participants, newParticipant],
  };
}

/**
 * Remove participant from split
 */
export function removeParticipant(
  split: Omit<BillSplit, 'documentId' | 'slug'>,
  personId: string
): Omit<BillSplit, 'documentId' | 'slug'> {
  if (split.participants.length <= 2) {
    throw new Error('Cannot have fewer than 2 participants');
  }

  return {
    ...split,
    participants: split.participants.filter((p) => p.personId !== personId),
  };
}

/**
 * Assign item to participant
 */
export function assignItemToParticipant(
  split: Omit<BillSplit, 'documentId' | 'slug'>,
  personId: string,
  item: AssignedItem
): Omit<BillSplit, 'documentId' | 'slug'> {
  return {
    ...split,
    participants: split.participants.map((p) => {
      if (p.personId !== personId) return p;

      // Check if item already assigned to this person
      const existingIndex = p.assignedItems.findIndex(
        (a) => a.itemDocumentId === item.itemDocumentId
      );

      if (existingIndex >= 0) {
        // Update existing assignment
        const newItems = [...p.assignedItems];
        newItems[existingIndex] = item;
        return { ...p, assignedItems: newItems };
      }

      // Add new assignment
      return { ...p, assignedItems: [...p.assignedItems, item] };
    }),
  };
}

/**
 * Move item from one participant to another
 */
export function moveItemBetweenParticipants(
  split: Omit<BillSplit, 'documentId' | 'slug'>,
  itemDocumentId: string,
  fromPersonId: string,
  toPersonId: string
): Omit<BillSplit, 'documentId' | 'slug'> {
  const fromParticipant = split.participants.find((p) => p.personId === fromPersonId);
  if (!fromParticipant) return split;

  const item = fromParticipant.assignedItems.find(
    (a) => a.itemDocumentId === itemDocumentId
  );
  if (!item) return split;

  return {
    ...split,
    participants: split.participants.map((p) => {
      if (p.personId === fromPersonId) {
        return {
          ...p,
          assignedItems: p.assignedItems.filter(
            (a) => a.itemDocumentId !== itemDocumentId
          ),
        };
      }
      if (p.personId === toPersonId) {
        return {
          ...p,
          assignedItems: [...p.assignedItems, item],
        };
      }
      return p;
    }),
  };
}
