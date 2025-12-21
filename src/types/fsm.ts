/**
 * Finite State Machine Definitions
 *
 * FSMs for OrderItem and StorageBatch with:
 * - Allowed transitions
 * - Guards per role
 * - Audit requirements
 */

// ==========================================
// ORDER ITEM FSM
// ==========================================

export type OrderItemState =
  | 'draft'        // In cart, not submitted
  | 'queued'       // Submitted, waiting for kitchen
  | 'pending'      // Acknowledged by kitchen
  | 'in_progress'  // Cooking started
  | 'ready'        // Ready to serve
  | 'served'       // Delivered to customer
  | 'returned'     // Returned by customer
  | 'cancelled'    // Cancelled before completion
  | 'voided';      // Voided after completion (refund)

export type OrderItemEvent =
  | 'SUBMIT'       // Submit order to kitchen
  | 'ACKNOWLEDGE'  // Kitchen acknowledges
  | 'START'        // Start cooking
  | 'COMPLETE'     // Finish cooking
  | 'SERVE'        // Deliver to table
  | 'RETURN'       // Customer returns item
  | 'UNDO'         // Undo to previous state
  | 'CANCEL'       // Cancel before completion
  | 'VOID';        // Void after completion

export interface FSMTransition<S, E> {
  from: S | S[];
  event: E;
  to: S;
  guards: FSMGuard[];
  requiresReason: boolean;
  auditLevel: 'info' | 'warning' | 'critical';
}

export interface FSMGuard {
  type: 'role' | 'time' | 'condition' | 'approval';
  roles?: string[];
  condition?: string;
  approvalFrom?: string[];
  maxTimeMs?: number;
}

export const ORDER_ITEM_TRANSITIONS: FSMTransition<OrderItemState, OrderItemEvent>[] = [
  // Normal flow
  {
    from: 'draft',
    event: 'SUBMIT',
    to: 'queued',
    guards: [{ type: 'role', roles: ['waiter', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: 'queued',
    event: 'ACKNOWLEDGE',
    to: 'pending',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: 'pending',
    event: 'START',
    to: 'in_progress',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: 'in_progress',
    event: 'COMPLETE',
    to: 'ready',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: 'ready',
    event: 'SERVE',
    to: 'served',
    guards: [{ type: 'role', roles: ['waiter', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },

  // Undo transitions (require reason)
  {
    from: 'ready',
    event: 'UNDO',
    to: 'in_progress',
    guards: [
      { type: 'role', roles: ['chef', 'manager', 'admin'] },
      { type: 'time', maxTimeMs: 300000 }, // 5 minutes
    ],
    requiresReason: true,
    auditLevel: 'warning',
  },
  {
    from: 'served',
    event: 'UNDO',
    to: 'ready',
    guards: [
      { type: 'role', roles: ['manager', 'admin'] },
      { type: 'time', maxTimeMs: 600000 }, // 10 minutes
    ],
    requiresReason: true,
    auditLevel: 'warning',
  },
  {
    from: 'in_progress',
    event: 'UNDO',
    to: 'pending',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: true,
    auditLevel: 'warning',
  },

  // Return flow
  {
    from: 'served',
    event: 'RETURN',
    to: 'returned',
    guards: [{ type: 'role', roles: ['waiter', 'manager', 'admin'] }],
    requiresReason: true,
    auditLevel: 'warning',
  },
  {
    from: 'returned',
    event: 'START',
    to: 'in_progress',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },

  // Cancel flow
  {
    from: ['draft', 'queued', 'pending'],
    event: 'CANCEL',
    to: 'cancelled',
    guards: [{ type: 'role', roles: ['waiter', 'manager', 'admin'] }],
    requiresReason: true,
    auditLevel: 'warning',
  },
  {
    from: 'in_progress',
    event: 'CANCEL',
    to: 'cancelled',
    guards: [
      { type: 'role', roles: ['manager', 'admin'] },
      { type: 'approval', approvalFrom: ['chef'] },
    ],
    requiresReason: true,
    auditLevel: 'critical',
  },

  // Void flow (post-completion)
  {
    from: 'served',
    event: 'VOID',
    to: 'voided',
    guards: [
      { type: 'role', roles: ['manager', 'admin'] },
      { type: 'approval', approvalFrom: ['admin'] },
    ],
    requiresReason: true,
    auditLevel: 'critical',
  },
];

// ==========================================
// STORAGE BATCH FSM
// ==========================================

export type StorageBatchState =
  | 'received'     // Just received, not processed
  | 'inspecting'   // Quality inspection
  | 'processing'   // Being processed (cleaning, etc.)
  | 'available'    // Available for use
  | 'reserved'     // Reserved for order
  | 'depleted'     // Fully used
  | 'expired'      // Past expiry date
  | 'quarantine'   // Quality issue
  | 'written_off'; // Written off

export type StorageBatchEvent =
  | 'INSPECT'       // Start inspection
  | 'APPROVE'       // Pass inspection
  | 'REJECT'        // Fail inspection
  | 'START_PROCESS' // Start processing
  | 'END_PROCESS'   // End processing
  | 'RESERVE'       // Reserve for order
  | 'RELEASE'       // Release reservation
  | 'USE'           // Use stock
  | 'EXPIRE'        // Mark as expired
  | 'QUARANTINE'    // Put in quarantine
  | 'WRITE_OFF'     // Write off
  | 'CALIBRATE';    // Calibrate yield (manager)

export const STORAGE_BATCH_TRANSITIONS: FSMTransition<StorageBatchState, StorageBatchEvent>[] = [
  // Receiving flow
  {
    from: 'received',
    event: 'INSPECT',
    to: 'inspecting',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: 'inspecting',
    event: 'APPROVE',
    to: 'available',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: 'inspecting',
    event: 'REJECT',
    to: 'quarantine',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: true,
    auditLevel: 'warning',
  },
  {
    from: 'received',
    event: 'APPROVE',
    to: 'available',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },

  // Processing flow
  {
    from: 'available',
    event: 'START_PROCESS',
    to: 'processing',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: 'processing',
    event: 'END_PROCESS',
    to: 'available',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },

  // Usage flow
  {
    from: 'available',
    event: 'RESERVE',
    to: 'reserved',
    guards: [{ type: 'role', roles: ['chef', 'waiter', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: 'reserved',
    event: 'RELEASE',
    to: 'available',
    guards: [{ type: 'role', roles: ['chef', 'waiter', 'manager', 'admin'] }],
    requiresReason: false,
    auditLevel: 'info',
  },
  {
    from: ['available', 'reserved'],
    event: 'USE',
    to: 'depleted',
    guards: [{ type: 'condition', condition: 'netAvailable <= 0' }],
    requiresReason: false,
    auditLevel: 'info',
  },

  // Expiry flow
  {
    from: ['received', 'available', 'reserved'],
    event: 'EXPIRE',
    to: 'expired',
    guards: [{ type: 'condition', condition: 'expiryDate <= now' }],
    requiresReason: false,
    auditLevel: 'warning',
  },

  // Quality issues
  {
    from: ['available', 'reserved', 'processing'],
    event: 'QUARANTINE',
    to: 'quarantine',
    guards: [{ type: 'role', roles: ['chef', 'manager', 'admin'] }],
    requiresReason: true,
    auditLevel: 'critical',
  },

  // Write-off flow
  {
    from: ['available', 'expired', 'quarantine'],
    event: 'WRITE_OFF',
    to: 'written_off',
    guards: [
      { type: 'role', roles: ['manager', 'admin'] },
    ],
    requiresReason: true,
    auditLevel: 'critical',
  },

  // Calibration (yield adjustment)
  {
    from: 'available',
    event: 'CALIBRATE',
    to: 'available',
    guards: [
      { type: 'role', roles: ['manager', 'admin'] },
      { type: 'approval', approvalFrom: ['admin'] },
    ],
    requiresReason: true,
    auditLevel: 'critical',
  },
];

// ==========================================
// FSM ENGINE
// ==========================================

export interface FSMContext {
  currentState: string;
  actorId: string;
  actorRole: string;
  stateEnteredAt: string;
  metadata?: Record<string, unknown>;
}

export interface FSMTransitionResult {
  success: boolean;
  newState?: string;
  error?: {
    code: string;
    message: string;
    failedGuards?: string[];
  };
}

export function canTransition<S extends string, E extends string>(
  transitions: FSMTransition<S, E>[],
  context: FSMContext,
  event: E,
  reason?: string
): FSMTransitionResult {
  // Find matching transition
  const transition = transitions.find((t) => {
    const fromStates = Array.isArray(t.from) ? t.from : [t.from];
    return fromStates.includes(context.currentState as S) && t.event === event;
  });

  if (!transition) {
    return {
      success: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${context.currentState} via ${event}`,
      },
    };
  }

  // Check reason requirement
  if (transition.requiresReason && !reason) {
    return {
      success: false,
      error: {
        code: 'REASON_REQUIRED',
        message: `Transition ${event} requires a reason`,
      },
    };
  }

  // Check guards
  const failedGuards: string[] = [];

  for (const guard of transition.guards) {
    switch (guard.type) {
      case 'role':
        if (!guard.roles?.includes(context.actorRole)) {
          failedGuards.push(`Role ${context.actorRole} not in ${guard.roles?.join(', ')}`);
        }
        break;

      case 'time':
        if (guard.maxTimeMs) {
          const elapsed = Date.now() - new Date(context.stateEnteredAt).getTime();
          if (elapsed > guard.maxTimeMs) {
            failedGuards.push(`Time limit exceeded: ${elapsed}ms > ${guard.maxTimeMs}ms`);
          }
        }
        break;

      case 'approval':
        // Would check approval status in real implementation
        break;

      case 'condition':
        // Would evaluate condition in real implementation
        break;
    }
  }

  if (failedGuards.length > 0) {
    return {
      success: false,
      error: {
        code: 'GUARD_FAILED',
        message: 'Transition guards not satisfied',
        failedGuards,
      },
    };
  }

  return {
    success: true,
    newState: transition.to,
  };
}

export function getAvailableTransitions<S extends string, E extends string>(
  transitions: FSMTransition<S, E>[],
  currentState: S,
  actorRole: string
): Array<{ event: E; to: S; requiresReason: boolean }> {
  return transitions
    .filter((t) => {
      const fromStates = Array.isArray(t.from) ? t.from : [t.from];
      if (!fromStates.includes(currentState)) return false;

      // Check role guard
      const roleGuard = t.guards.find((g) => g.type === 'role');
      if (roleGuard && !roleGuard.roles?.includes(actorRole)) return false;

      return true;
    })
    .map((t) => ({
      event: t.event,
      to: t.to,
      requiresReason: t.requiresReason,
    }));
}

// ==========================================
// REASON CODES
// ==========================================

export const UNDO_REASON_CODES = {
  CUSTOMER_REFUSED: {
    code: 'CUSTOMER_REFUSED',
    label: { uk: 'Клієнт відмовився', en: 'Customer refused' },
    requiresNote: false,
  },
  WRONG_PREPARATION: {
    code: 'WRONG_PREPARATION',
    label: { uk: 'Неправильне приготування', en: 'Wrong preparation' },
    requiresNote: true,
  },
  ALLERGY_CONCERN: {
    code: 'ALLERGY_CONCERN',
    label: { uk: 'Алергія виявлена', en: 'Allergy concern' },
    requiresNote: true,
  },
  QUALITY_ISSUE: {
    code: 'QUALITY_ISSUE',
    label: { uk: 'Проблема з якістю', en: 'Quality issue' },
    requiresNote: true,
  },
  TEMPERATURE_ISSUE: {
    code: 'TEMPERATURE_ISSUE',
    label: { uk: 'Неправильна температура', en: 'Temperature issue' },
    requiresNote: false,
  },
  CONTAMINATION: {
    code: 'CONTAMINATION',
    label: { uk: 'Забруднення', en: 'Contamination' },
    requiresNote: true,
  },
  WRONG_ORDER: {
    code: 'WRONG_ORDER',
    label: { uk: 'Неправильне замовлення', en: 'Wrong order' },
    requiresNote: false,
  },
  DELAY_COMPENSATION: {
    code: 'DELAY_COMPENSATION',
    label: { uk: 'Компенсація затримки', en: 'Delay compensation' },
    requiresNote: false,
  },
  OTHER: {
    code: 'OTHER',
    label: { uk: 'Інше', en: 'Other' },
    requiresNote: true,
  },
} as const;

export const WRITE_OFF_REASON_CODES = {
  EXPIRED: {
    code: 'EXPIRED',
    label: { uk: 'Прострочено', en: 'Expired' },
    requiresNote: false,
  },
  SPOILED: {
    code: 'SPOILED',
    label: { uk: 'Зіпсовано', en: 'Spoiled' },
    requiresNote: true,
  },
  DAMAGED: {
    code: 'DAMAGED',
    label: { uk: 'Пошкоджено', en: 'Damaged' },
    requiresNote: true,
  },
  COOKING_LOSS: {
    code: 'COOKING_LOSS',
    label: { uk: 'Втрати при готуванні', en: 'Cooking loss' },
    requiresNote: false,
  },
  YIELD_VARIANCE: {
    code: 'YIELD_VARIANCE',
    label: { uk: 'Відхилення виходу', en: 'Yield variance' },
    requiresNote: true,
  },
  QUALITY_FAIL: {
    code: 'QUALITY_FAIL',
    label: { uk: 'Не пройшло перевірку якості', en: 'Quality fail' },
    requiresNote: true,
  },
  THEFT: {
    code: 'THEFT',
    label: { uk: 'Крадіжка', en: 'Theft' },
    requiresNote: true,
  },
  INVENTORY_ADJUST: {
    code: 'INVENTORY_ADJUST',
    label: { uk: 'Коригування інвентаризації', en: 'Inventory adjustment' },
    requiresNote: true,
  },
} as const;

export type UndoReasonCode = keyof typeof UNDO_REASON_CODES;
export type WriteOffReasonCode = keyof typeof WRITE_OFF_REASON_CODES;
