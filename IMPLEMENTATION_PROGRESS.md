# Implementation Progress - Restaurant OS Fixes

> **Started:** 2026-01-10
> **Completed:** 2026-01-10
> **Status:** ALL FIXES COMPLETED

---

## Fix Plan Summary

| # | Fix | Priority | Status | Files Modified |
|---|-----|----------|--------|----------------|
| 1 | Wire POS order creation to GraphQL | HIGH | DONE | `order-confirm-dialog.tsx` |
| 2 | Wire Kitchen ticket start to backend | HIGH | DONE | `kitchen/page.tsx` |
| 3 | Implement getRecipeForMenuItem | HIGH | DONE | `use-inventory-deduction.ts`, `queries.ts` |
| 4 | Wire Kitchen complete/cancel to backend | HIGH | DONE | `kitchen/page.tsx` |
| 5 | Connect analyticsApi to real data | MEDIUM | DONE | `lib/api.ts` |
| 6 | Add OrderItem lifecycle for tickets | MEDIUM | DONE | `backend/.../lifecycles.ts` |

---

## Detailed Progress Log

### Fix 1: Wire POS Order Creation to GraphQL
**Status:** COMPLETED

**Files modified:**
- `frontend/src/features/orders/order-confirm-dialog.tsx`

**Changes:**
- [x] Imported `useCreateOrder`, `useAddOrderItem`, `useUpdateOrderStatus` hooks
- [x] Replaced local orderId generation with GraphQL `createOrder` mutation
- [x] Created order items via `addOrderItem` mutation in loop
- [x] Added `updateOrderStatus` to set order to 'confirmed'
- [x] Added error state and error UI display
- [x] Added orderNumber display in success message

**Data Flow Now:**
```
Cart Items → createOrder(GraphQL) → Order in Strapi
           → addOrderItem(GraphQL) × N → OrderItems in Strapi
           → updateOrderStatus('confirmed')
           → createKitchenTasksFromOrder() → Local kitchen store
           → tableSessionEventsApi.createEvent()
```

---

### Fix 2: Wire Kitchen Ticket Start to Backend
**Status:** COMPLETED

**Files modified:**
- `frontend/src/app/kitchen/page.tsx`

**Changes:**
- [x] Imported `useStartTicket`, `useCompleteTicket`, `useCancelTicket` hooks
- [x] Added `ticketError` state for error notifications
- [x] Modified `handleTaskStart` to call backend mutation first
- [x] Handles `INSUFFICIENT_STOCK` error code
- [x] Falls back to local store if backend unavailable
- [x] Logs consumedBatches from backend response

**Inventory Deduction Flow:**
```
Chef clicks Start → startTicket(GraphQL)
                  → Backend: start-ticket.ts
                  → FIFO batch selection
                  → InventoryMovement records created
                  → StockBatch.netAvailable updated
                  → Ingredient.currentStock updated
                  → ticket.inventoryLocked = true
                  → Returns consumedBatches
```

---

### Fix 3: Implement getRecipeForMenuItem via GraphQL
**Status:** COMPLETED

**Files modified:**
- `frontend/src/graphql/queries.ts` (added GET_MENU_ITEM_RECIPE)
- `frontend/src/hooks/use-inventory-deduction.ts`

**Changes:**
- [x] Added `GET_MENU_ITEM_RECIPE` GraphQL query
- [x] Replaced placeholder `getRecipeForMenuItem` with real GraphQL call
- [x] Uses `getUrqlClient()` for direct client access
- [x] Transforms recipe ingredients to expected format
- [x] Includes yieldProfile for each ingredient

**GraphQL Query:**
```graphql
query GetMenuItemRecipe($menuItemId: ID!) {
  menuItem(documentId: $menuItemId) {
    recipe {
      documentId
      ingredients {
        ingredient { documentId, name, unit, yieldProfile }
        quantity
        unit
        processChain
        wasteAllowancePercent
      }
    }
  }
}
```

---

### Fix 4: Wire Kitchen Complete/Cancel to Backend
**Status:** COMPLETED

**Files modified:**
- `frontend/src/app/kitchen/page.tsx`

**Changes:**
- [x] `handleTaskComplete` calls `completeTicket` mutation
- [x] `handleTaskPass` uses `handleTaskComplete`
- [x] Added error banner UI for ticket errors
- [x] Auto-clears error after 5 seconds

---

### Fix 5: Connect analyticsApi to Real Data
**Status:** COMPLETED

**Files modified:**
- `frontend/src/lib/api.ts`

**Changes:**
- [x] Imported `tableSessionEventsApi` and `getUrqlClient`
- [x] `getKPIs()` now calls `tableSessionEventsApi.getKPIs()` for real data
- [x] Returns 5 real KPIs: order time, first item time, session time, orders, sessions
- [x] `getAlerts()` now queries `GET_STOCK_ALERTS` for low stock items
- [x] Added `getKPIsForPeriod()` for date range queries

**KPIs Returned:**
1. Час прийому замовлення (avgTimeToTakeOrderMs)
2. Час до першої страви (avgTimeToFirstItemMs)
3. Середня тривалість сесії (avgTotalSessionTimeMs)
4. Замовлень сьогодні (totalOrders)
5. Сесій сьогодні (totalSessions)

---

### Fix 6: Add OrderItem Lifecycle for Auto Ticket Creation
**Status:** COMPLETED

**Files modified:**
- `backend/src/api/order-item/content-types/order-item/lifecycles.ts`

**Changes:**
- [x] Added `afterCreate` hook
- [x] Auto-creates KitchenTicket when OrderItem is created
- [x] Determines station from menuItem.outputType or primaryStation
- [x] Creates initial TicketEvent with metadata
- [x] Generates unique ticketNumber
- [x] Non-blocking: logs errors but doesn't throw

**Auto-Creation Flow:**
```
OrderItem created → afterCreate lifecycle
                  → Load menuItem for station
                  → Create KitchenTicket (status: queued)
                  → Create TicketEvent (type: created)
```

---

## Final System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POS (waiter/page.tsx)                                                  │
│      │                                                                   │
│      └──► order-confirm-dialog.tsx                                      │
│              │                                                           │
│              ├──► useCreateOrder()      ──► GraphQL ──► Order           │
│              ├──► useAddOrderItem()     ──► GraphQL ──► OrderItem ───┐  │
│              └──► useUpdateOrderStatus() ──► GraphQL ──► confirmed    │  │
│                                                                       │  │
│  Kitchen (kitchen/page.tsx)                                           │  │
│      │                                                                │  │
│      ├──► handleTaskStart()                                           │  │
│      │        └──► useStartTicket() ──► GraphQL ──► start-ticket.ts   │  │
│      │                                      └──► FIFO Deduction       │  │
│      ├──► handleTaskComplete()                                        │  │
│      │        └──► useCompleteTicket() ──► GraphQL                    │  │
│      └──► handleTaskCancel()                                          │  │
│               └──► useCancelTicket() ──► GraphQL ──► Release inv.     │  │
│                                                                       │  │
│  Analytics (lib/api.ts)                                               │  │
│      │                                                                │  │
│      ├──► getKPIs() ──► tableSessionEventsApi.getKPIs()              │  │
│      └──► getAlerts() ──► GraphQL GET_STOCK_ALERTS                   │  │
│                                                                       │  │
└───────────────────────────────────────────────────────────────────────┘  │
                                                                           │
┌─────────────────────────────────────────────────────────────────────────┐│
│                           BACKEND (Strapi)                              ││
├─────────────────────────────────────────────────────────────────────────┤│
│                                                                          │
│  OrderItem Lifecycle (afterCreate)  ◄────────────────────────────────────┘
│      │                                                                   │
│      └──► Create KitchenTicket (queued)                                 │
│           └──► Create TicketEvent (created)                             │
│                                                                          │
│  KitchenTicket Service (start-ticket.ts)                                │
│      │                                                                   │
│      ├──► Load recipe.ingredients                                       │
│      ├──► FIFO/FEFO batch selection                                     │
│      ├──► Unit conversion + yield calculation                           │
│      ├──► Create InventoryMovement records                              │
│      ├──► Update StockBatch.netAvailable                                │
│      ├──► Update Ingredient.currentStock                                │
│      └──► Set ticket.inventoryLocked = true                             │
│                                                                          │
│  TableSessionEvent API                                                  │
│      │                                                                   │
│      └──► Store events for KPI calculations                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Create order via POS → Check Order created in Strapi
- [ ] Check OrderItems created in Strapi
- [ ] Check KitchenTickets auto-created by lifecycle
- [ ] Start ticket in kitchen → Check InventoryMovements created
- [ ] Check StockBatch quantities decreased
- [ ] Check Ingredient.currentStock decreased
- [ ] Complete ticket → Check status changed
- [ ] Check analyticsApi.getKPIs() returns real data
- [ ] Check analyticsApi.getAlerts() shows low stock items

---

## Remaining Considerations

1. **WebSocket Real-time Updates**: Not implemented. Kitchen uses 30s polling fallback.

2. **Authentication**: Frontend auth-store exists but not fully wired. Need to:
   - Store JWT after login
   - Pass token in GraphQL headers
   - Implement role-based guards

3. **Error Recovery**: If backend is down, system falls back to local stores.

4. **Data Sync**: Local kitchen-store may drift from server. Consider:
   - Periodic sync with GET_KITCHEN_QUEUE
   - WebSocket for instant updates

---

**All critical fixes completed.**
