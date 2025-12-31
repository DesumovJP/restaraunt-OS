/**
 * GraphQL Fragments
 * Reusable fragments for Strapi v5 entities
 */

import { gql } from 'urql';

// Menu Item fragment
export const MENU_ITEM_FRAGMENT = gql`
  fragment MenuItemCore on MenuItem {
    documentId
    name
    nameUk
    slug
    description
    price
    weight
    preparationTime
    available
    outputType
    servingCourse
    primaryStation
    allergens
    image {
      url
      alternativeText
    }
    category {
      documentId
      name
      slug
    }
  }
`;

// Kitchen Ticket fragment
export const KITCHEN_TICKET_FRAGMENT = gql`
  fragment KitchenTicketCore on KitchenTicket {
    documentId
    ticketNumber
    status
    station
    priority
    priorityScore
    startedAt
    completedAt
    elapsedSeconds
    inventoryLocked
    assignedChef {
      documentId
      username
    }
    orderItem {
      documentId
      quantity
      notes
      modifiers
      menuItem {
        documentId
        name
        price
        preparationTime
      }
    }
    order {
      documentId
      orderNumber
      table {
        documentId
        number
      }
    }
  }
`;

// Order fragment
export const ORDER_FRAGMENT = gql`
  fragment OrderCore on Order {
    documentId
    orderNumber
    status
    totalAmount
    taxAmount
    tipAmount
    guestCount
    notes
    tableStartAt
    createdAt
    updatedAt
    table {
      documentId
      number
      status
    }
    waiter {
      documentId
      username
    }
  }
`;

// Order Item fragment
export const ORDER_ITEM_FRAGMENT = gql`
  fragment OrderItemCore on OrderItem {
    documentId
    quantity
    unitPrice
    totalPrice
    status
    statusChangedAt
    courseType
    courseIndex
    notes
    comment
    modifiers
    prepStartAt
    prepElapsedMs
    servedAt
    menuItem {
      documentId
      name
      price
      preparationTime
    }
  }
`;

// Inventory Movement fragment
export const INVENTORY_MOVEMENT_FRAGMENT = gql`
  fragment InventoryMovementCore on InventoryMovement {
    documentId
    movementType
    quantity
    unit
    grossQuantity
    netQuantity
    wasteFactor
    unitCost
    totalCost
    reason
    reasonCode
    createdAt
    ingredient {
      documentId
      name
      sku
    }
    stockBatch {
      documentId
      batchNumber
      expiryDate
    }
  }
`;

// Stock Batch fragment
export const STOCK_BATCH_FRAGMENT = gql`
  fragment StockBatchCore on StockBatch {
    documentId
    batchNumber
    barcode
    grossIn
    netAvailable
    usedAmount
    wastedAmount
    unitCost
    totalCost
    receivedAt
    expiryDate
    status
    isLocked
    ingredient {
      documentId
      name
      sku
      unit
    }
    supplier {
      documentId
      name
    }
  }
`;

// Ingredient fragment
export const INGREDIENT_FRAGMENT = gql`
  fragment IngredientCore on Ingredient {
    documentId
    name
    nameUk
    sku
    unit
    currentStock
    minStock
    maxStock
    mainCategory
    subCategory
    storageCondition
    costPerUnit
    isActive
  }
`;
