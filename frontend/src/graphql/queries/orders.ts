/**
 * Orders GraphQL Queries
 * Queries for orders, order items, and tables
 */

import { gql } from "urql";

/**
 * Get all active orders (excluding paid/cancelled)
 */
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

/**
 * Get detailed order information by documentId
 */
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

/**
 * Get all active tables
 */
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
