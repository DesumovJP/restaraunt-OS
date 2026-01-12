/**
 * Kitchen GraphQL Queries
 * Queries for kitchen queue and ticket management
 */

import { gql } from "urql";

/**
 * Get kitchen queue tickets filtered by station and status
 */
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
