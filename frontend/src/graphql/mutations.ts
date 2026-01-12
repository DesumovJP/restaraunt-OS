/**
 * GraphQL Mutations
 * Strapi v5 GraphQL mutations for Restaurant OS
 */

import { gql } from 'urql';

// Start Kitchen Ticket (triggers inventory deduction)
export const START_KITCHEN_TICKET = gql`
  mutation StartKitchenTicket($documentId: ID!) {
    startKitchenTicket(documentId: $documentId) {
      success
      ticket {
        documentId
        status
        startedAt
        inventoryLocked
        assignedChef {
          documentId
          username
        }
      }
      consumedBatches {
        batchDocumentId
        ingredientDocumentId
        grossQuantity
        netQuantity
        cost
      }
      error {
        code
        message
        details
      }
    }
  }
`;

// Complete Kitchen Ticket
export const COMPLETE_KITCHEN_TICKET = gql`
  mutation CompleteKitchenTicket($documentId: ID!) {
    completeKitchenTicket(documentId: $documentId) {
      success
      ticket {
        documentId
        status
        completedAt
        elapsedSeconds
      }
      error {
        code
        message
      }
    }
  }
`;

// Pause Kitchen Ticket
export const PAUSE_KITCHEN_TICKET = gql`
  mutation PauseKitchenTicket($documentId: ID!, $reason: String) {
    pauseKitchenTicket(documentId: $documentId, reason: $reason) {
      success
      ticket {
        documentId
        status
      }
      error {
        code
        message
      }
    }
  }
`;

// Resume Kitchen Ticket
export const RESUME_KITCHEN_TICKET = gql`
  mutation ResumeKitchenTicket($documentId: ID!) {
    resumeKitchenTicket(documentId: $documentId) {
      success
      ticket {
        documentId
        status
      }
      error {
        code
        message
      }
    }
  }
`;

// Cancel Kitchen Ticket (releases inventory)
export const CANCEL_KITCHEN_TICKET = gql`
  mutation CancelKitchenTicket($documentId: ID!, $reason: String) {
    cancelKitchenTicket(documentId: $documentId, reason: $reason) {
      success
      ticket {
        documentId
        status
        inventoryLocked
      }
      error {
        code
        message
      }
    }
  }
`;

// Create Order
export const CREATE_ORDER = gql`
  mutation CreateOrder($data: OrderInput!) {
    createOrder(data: $data) {
      documentId
      orderNumber
      status
      totalAmount
      table {
        documentId
        number
      }
      waiter {
        documentId
        username
      }
    }
  }
`;

// Update Order Status
// Note: Strapi v5 uses ENUM_ORDER_STATUS for the status field
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($documentId: ID!, $status: ENUM_ORDER_STATUS!) {
    updateOrder(documentId: $documentId, data: { status: $status }) {
      documentId
      status
      updatedAt
    }
  }
`;

// Create Order Item
export const CREATE_ORDER_ITEM = gql`
  mutation CreateOrderItem($data: OrderItemInput!) {
    createOrderItem(data: $data) {
      documentId
      quantity
      unitPrice
      totalPrice
      status
      courseType
      menuItem {
        documentId
        name
        price
      }
    }
  }
`;

// Update Order Item Status
export const UPDATE_ORDER_ITEM_STATUS = gql`
  mutation UpdateOrderItemStatus($documentId: ID!, $status: ENUM_ORDERITEM_STATUS!) {
    updateOrderItem(documentId: $documentId, data: { status: $status }) {
      documentId
      status
      statusChangedAt
    }
  }
`;

// Update Table Status
export const UPDATE_TABLE_STATUS = gql`
  mutation UpdateTableStatus($documentId: ID!, $status: ENUM_TABLE_STATUS!, $currentGuests: Int) {
    updateTable(
      documentId: $documentId
      data: { status: $status, currentGuests: $currentGuests }
    ) {
      documentId
      number
      status
      currentGuests
      occupiedAt
    }
  }
`;

// Create Stock Batch
export const CREATE_STOCK_BATCH = gql`
  mutation CreateStockBatch($data: StockBatchInput!) {
    createStockBatch(data: $data) {
      documentId
      batchNumber
      grossIn
      netAvailable
      unitCost
      totalCost
      receivedAt
      expiryDate
      status
      ingredient {
        documentId
        name
      }
      supplier {
        documentId
        name
      }
    }
  }
`;

// Update Stock Batch Status
export const UPDATE_STOCK_BATCH_STATUS = gql`
  mutation UpdateStockBatchStatus($documentId: ID!, $status: ENUM_STOCKBATCH_STATUS!) {
    updateStockBatch(documentId: $documentId, data: { status: $status }) {
      documentId
      status
      netAvailable
    }
  }
`;

// Update Stock Batch (for write-off)
export const UPDATE_STOCK_BATCH = gql`
  mutation UpdateStockBatch($documentId: ID!, $data: StockBatchInput!) {
    updateStockBatch(documentId: $documentId, data: $data) {
      documentId
      netAvailable
      wastedAmount
      usedAmount
      status
    }
  }
`;

// Create Inventory Movement (for adjustments)
export const CREATE_INVENTORY_MOVEMENT = gql`
  mutation CreateInventoryMovement($data: InventoryMovementInput!) {
    createInventoryMovement(data: $data) {
      documentId
      movementType
      quantity
      unit
      reason
      reasonCode
      notes
      createdAt
      ingredient {
        documentId
        name
      }
      stockBatch {
        documentId
        batchNumber
      }
    }
  }
`;

// Update Ingredient Stock
export const UPDATE_INGREDIENT_STOCK = gql`
  mutation UpdateIngredientStock($documentId: ID!, $currentStock: Float!) {
    updateIngredient(documentId: $documentId, data: { currentStock: $currentStock }) {
      documentId
      name
      currentStock
    }
  }
`;

// ==========================================
// SCHEDULED ORDERS
// ==========================================

// Create Scheduled Order
export const CREATE_SCHEDULED_ORDER = gql`
  mutation CreateScheduledOrder($data: ScheduledOrderInput!) {
    createScheduledOrder(data: $data) {
      documentId
      scheduledFor
      prepStartAt
      status
      eventType
      eventName
      guestCount
      totalAmount
      table {
        documentId
        number
      }
      contactName
      contactPhone
      paymentStatus
    }
  }
`;

// Update Scheduled Order
export const UPDATE_SCHEDULED_ORDER = gql`
  mutation UpdateScheduledOrder($documentId: ID!, $data: ScheduledOrderInput!) {
    updateScheduledOrder(documentId: $documentId, data: $data) {
      documentId
      status
      scheduledFor
      prepStartAt
      eventType
      eventName
      guestCount
      totalAmount
      contactName
      paymentStatus
    }
  }
`;

// Update Scheduled Order Status
export const UPDATE_SCHEDULED_ORDER_STATUS = gql`
  mutation UpdateScheduledOrderStatus($documentId: ID!, $status: ENUM_SCHEDULEDORDER_STATUS!) {
    updateScheduledOrder(documentId: $documentId, data: { status: $status }) {
      documentId
      status
    }
  }
`;

// Delete Scheduled Order
export const DELETE_SCHEDULED_ORDER = gql`
  mutation DeleteScheduledOrder($documentId: ID!) {
    deleteScheduledOrder(documentId: $documentId) {
      documentId
    }
  }
`;

// ==========================================
// RESERVATIONS
// ==========================================

// Create Reservation
export const CREATE_RESERVATION = gql`
  mutation CreateReservation($data: ReservationInput!) {
    createReservation(data: $data) {
      documentId
      date
      startTime
      endTime
      guestCount
      status
      contactName
      contactPhone
      confirmationCode
      table {
        documentId
        number
      }
    }
  }
`;

// Update Reservation
export const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($documentId: ID!, $data: ReservationInput!) {
    updateReservation(documentId: $documentId, data: $data) {
      documentId
      date
      startTime
      endTime
      guestCount
      status
      contactName
      contactPhone
    }
  }
`;

// Update Reservation Status
export const UPDATE_RESERVATION_STATUS = gql`
  mutation UpdateReservationStatus($documentId: ID!, $status: ENUM_RESERVATION_STATUS!) {
    updateReservation(documentId: $documentId, data: { status: $status }) {
      documentId
      status
      seatedAt
      completedAt
    }
  }
`;

// Cancel Reservation
export const CANCEL_RESERVATION = gql`
  mutation CancelReservation($documentId: ID!) {
    updateReservation(documentId: $documentId, data: { status: "cancelled" }) {
      documentId
      status
    }
  }
`;
