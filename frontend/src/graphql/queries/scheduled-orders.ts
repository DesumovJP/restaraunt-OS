/**
 * Scheduled Orders GraphQL Queries
 * Queries for managing scheduled/planned orders
 */

import { gql } from "urql";

/**
 * Get scheduled orders for date range with optional status filter
 */
export const GET_SCHEDULED_ORDERS = gql`
  query GetScheduledOrders($fromDate: DateTime, $toDate: DateTime, $status: [String]) {
    scheduledOrders(
      filters: {
        scheduledFor: { gte: $fromDate, lte: $toDate }
        status: { in: $status }
      }
      sort: ["scheduledFor:asc"]
      pagination: { limit: 100 }
    ) {
      documentId
      scheduledFor
      prepStartAt
      status
      guestCount
      adultsCount
      childrenCount
      eventType
      eventName
      seatingArea
      menuPreset
      items
      totalAmount
      contactName
      contactPhone
      contactEmail
      contactCompany
      paymentStatus
      depositAmount
      depositPaidAt
      dietaryRequirements
      courseTimeline
      checklist
      decorations
      musicPreference
      cakeDetails
      notes
      confirmedAt
      table {
        documentId
        number
        capacity
      }
      assignedCoordinator {
        documentId
        username
      }
      createdBy {
        documentId
        username
      }
    }
  }
`;

/**
 * Get single scheduled order by documentId
 */
export const GET_SCHEDULED_ORDER = gql`
  query GetScheduledOrder($documentId: ID!) {
    scheduledOrder(documentId: $documentId) {
      documentId
      scheduledFor
      prepStartAt
      status
      guestCount
      adultsCount
      childrenCount
      eventType
      eventName
      seatingArea
      menuPreset
      items
      totalAmount
      contactName
      contactPhone
      contactEmail
      contactCompany
      paymentStatus
      depositAmount
      depositPaidAt
      dietaryRequirements
      courseTimeline
      checklist
      decorations
      musicPreference
      cakeDetails
      notes
      confirmedAt
      table {
        documentId
        number
        capacity
      }
      activatedOrder {
        documentId
        orderNumber
        status
      }
    }
  }
`;

/**
 * Get scheduled orders ready to activate (prep time has started)
 */
export const GET_ORDERS_READY_TO_ACTIVATE = gql`
  query GetOrdersReadyToActivate($now: DateTime!) {
    scheduledOrders(
      filters: {
        prepStartAt: { lte: $now }
        status: { eq: "scheduled" }
      }
      sort: ["prepStartAt:asc"]
    ) {
      documentId
      scheduledFor
      prepStartAt
      eventType
      eventName
      guestCount
      items
      totalAmount
      table {
        documentId
        number
      }
      contactName
    }
  }
`;
