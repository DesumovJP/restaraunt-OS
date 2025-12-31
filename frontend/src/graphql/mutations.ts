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
export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($documentId: ID!, $status: String!) {
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
  mutation UpdateOrderItemStatus($documentId: ID!, $status: String!) {
    updateOrderItem(documentId: $documentId, data: { status: $status }) {
      documentId
      status
      statusChangedAt
    }
  }
`;

// Update Table Status
export const UPDATE_TABLE_STATUS = gql`
  mutation UpdateTableStatus($documentId: ID!, $status: String!, $currentGuests: Int) {
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
  mutation UpdateStockBatchStatus($documentId: ID!, $status: String!) {
    updateStockBatch(documentId: $documentId, data: { status: $status }) {
      documentId
      status
      netAvailable
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
