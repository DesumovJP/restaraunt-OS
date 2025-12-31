/**
 * GraphQL Queries
 * Strapi v5 GraphQL queries for Restaurant OS
 */

import { gql } from 'urql';

// Kitchen Queue Query
export const GET_KITCHEN_QUEUE = gql`
  query GetKitchenQueue($station: String, $statuses: [String!]) {
    kitchenTickets(
      filters: {
        station: { eq: $station }
        status: { in: $statuses }
      }
      sort: ["priorityScore:desc", "createdAt:asc"]
      pagination: { limit: 100 }
    ) {
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
      createdAt
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
          image {
            url
          }
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
  }
`;

// All Categories with Items
export const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    menuCategories(
      filters: { isActive: { eq: true } }
      sort: ["sortOrder:asc"]
    ) {
      documentId
      name
      nameUk
      slug
      icon
      sortOrder
      menuItems(
        filters: { available: { eq: true } }
        pagination: { limit: 100 }
      ) {
        documentId
        name
        nameUk
        slug
        description
        price
        weight
        preparationTime
        available
        servingCourse
        primaryStation
        allergens
        image {
          url
          alternativeText
        }
      }
    }
  }
`;

// Active Orders
export const GET_ACTIVE_ORDERS = gql`
  query GetActiveOrders {
    orders(
      filters: {
        status: { notIn: ["paid", "cancelled"] }
      }
      sort: ["createdAt:desc"]
      pagination: { limit: 50 }
    ) {
      documentId
      orderNumber
      status
      totalAmount
      taxAmount
      guestCount
      notes
      tableStartAt
      createdAt
      table {
        documentId
        number
        status
      }
      waiter {
        documentId
        username
      }
      items {
        documentId
        quantity
        unitPrice
        totalPrice
        status
        courseType
        notes
        menuItem {
          documentId
          name
          price
        }
      }
    }
  }
`;

// Order Details
export const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($documentId: ID!) {
    order(documentId: $documentId) {
      documentId
      orderNumber
      status
      totalAmount
      taxAmount
      tipAmount
      guestCount
      notes
      tableStartAt
      paidAt
      paymentMethod
      createdAt
      updatedAt
      table {
        documentId
        number
        capacity
        zone
      }
      waiter {
        documentId
        username
      }
      items {
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
          nameUk
          price
          preparationTime
          image {
            url
          }
        }
      }
      tickets {
        documentId
        ticketNumber
        status
        station
        priority
        startedAt
        completedAt
        elapsedSeconds
      }
    }
  }
`;

// Tables
export const GET_TABLES = gql`
  query GetTables {
    tables(
      filters: { isActive: { eq: true } }
      sort: ["number:asc"]
    ) {
      documentId
      number
      capacity
      status
      currentGuests
      occupiedAt
      reservedBy
      reservedAt
      zone
    }
  }
`;

// Stock Alerts (low stock)
export const GET_STOCK_ALERTS = gql`
  query GetStockAlerts {
    ingredients(
      filters: {
        isActive: { eq: true }
      }
      sort: ["currentStock:asc"]
      pagination: { limit: 50 }
    ) {
      documentId
      name
      nameUk
      sku
      unit
      currentStock
      minStock
      mainCategory
      subCategory
      storageCondition
    }
  }
`;

// Available Batches for Ingredient (FIFO order)
export const GET_AVAILABLE_BATCHES = gql`
  query GetAvailableBatches($ingredientId: ID!) {
    stockBatches(
      filters: {
        ingredient: { documentId: { eq: $ingredientId } }
        status: { in: ["available", "received"] }
        netAvailable: { gt: 0 }
        isLocked: { ne: true }
      }
      sort: ["expiryDate:asc", "receivedAt:asc"]
    ) {
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
      supplier {
        documentId
        name
      }
    }
  }
`;

// Inventory Movements
export const GET_INVENTORY_MOVEMENTS = gql`
  query GetInventoryMovements(
    $ingredientId: ID
    $movementType: String
    $limit: Int
    $offset: Int
  ) {
    inventoryMovements(
      filters: {
        ingredient: { documentId: { eq: $ingredientId } }
        movementType: { eq: $movementType }
      }
      sort: ["createdAt:desc"]
      pagination: { limit: $limit, start: $offset }
    ) {
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
      notes
      createdAt
      ingredient {
        documentId
        name
        sku
      }
      stockBatch {
        documentId
        batchNumber
      }
      kitchenTicket {
        documentId
        ticketNumber
      }
      operator {
        documentId
        username
      }
    }
  }
`;

// Recipes
export const GET_RECIPES = gql`
  query GetRecipes {
    recipes(
      filters: { isActive: { eq: true } }
      sort: ["name:asc"]
    ) {
      documentId
      name
      nameUk
      slug
      portionYield
      costPerPortion
      prepTimeMinutes
      cookTimeMinutes
      isActive
      outputType
      ingredients {
        ingredient {
          documentId
          name
          unit
        }
        quantity
        unit
        processChain
        isOptional
        wasteAllowancePercent
      }
      steps {
        stepNumber
        description
        station
        estimatedTimeMinutes
        processType
      }
    }
  }
`;
