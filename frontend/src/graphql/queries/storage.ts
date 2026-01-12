/**
 * Storage GraphQL Queries
 * Queries for ingredients, stock batches, suppliers, and inventory movements
 */

import { gql } from "urql";

/**
 * Get ingredients sorted by stock level (for alerts)
 */
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

/**
 * Get all active ingredients (for supply form)
 */
export const GET_ALL_INGREDIENTS = gql`
  query GetAllIngredients {
    ingredients(
      filters: { isActive: { eq: true } }
      sort: ["name:asc"]
      pagination: { limit: 500 }
    ) {
      documentId
      name
      nameUk
      sku
      unit
      currentStock
      minStock
      maxStock
      mainCategory
      costPerUnit
    }
  }
`;

/**
 * Get all active suppliers
 */
export const GET_ALL_SUPPLIERS = gql`
  query GetAllSuppliers {
    suppliers(
      filters: { isActive: { eq: true } }
      sort: ["name:asc"]
    ) {
      documentId
      name
      contactName
      phone
      email
      taxId
    }
  }
`;

/**
 * Get available batches for an ingredient (FIFO order)
 */
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

/**
 * Get inventory movements with optional filters
 */
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

/**
 * Get all stock batches for storage page
 */
export const GET_ALL_STOCK_BATCHES = gql`
  query GetAllStockBatches($status: [String], $limit: Int) {
    stockBatches(
      filters: {
        status: { in: $status }
      }
      sort: ["receivedAt:desc"]
      pagination: { limit: $limit }
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
      lockedBy
      lockedAt
      invoiceNumber
      processes
      ingredient {
        documentId
        name
        nameUk
        unit
        mainCategory
      }
      supplier {
        documentId
        name
      }
    }
  }
`;

/**
 * Get today's stock batches (for shift summary)
 */
export const GET_TODAYS_BATCHES = gql`
  query GetTodaysBatches($fromDate: DateTime!) {
    stockBatches(
      filters: {
        receivedAt: { gte: $fromDate }
      }
      sort: ["receivedAt:desc"]
      pagination: { limit: 100 }
    ) {
      documentId
      batchNumber
      grossIn
      netAvailable
      unitCost
      totalCost
      receivedAt
      expiryDate
      status
      invoiceNumber
      ingredient {
        documentId
        name
        nameUk
      }
      supplier {
        documentId
        name
      }
    }
  }
`;
