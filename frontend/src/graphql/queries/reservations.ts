/**
 * Reservations GraphQL Queries
 * Queries for table reservations management
 */

import { gql } from "urql";

/**
 * Get reservations for a specific date
 */
export const GET_RESERVATIONS_FOR_DATE = gql`
  query GetReservationsForDate($date: Date!) {
    reservations(
      filters: {
        date: { eq: $date }
        status: { notIn: ["cancelled"] }
      }
      sort: ["startTime:asc"]
    ) {
      documentId
      date
      startTime
      endTime
      guestCount
      status
      contactName
      contactPhone
      contactEmail
      notes
      specialRequests
      occasion
      source
      confirmationCode
      confirmedAt
      table {
        documentId
        number
        capacity
        zone
      }
    }
  }
`;

/**
 * Get reservations for a specific table in date range
 */
export const GET_RESERVATIONS_FOR_TABLE = gql`
  query GetReservationsForTable($tableId: ID!, $fromDate: Date!, $toDate: Date!) {
    reservations(
      filters: {
        table: { documentId: { eq: $tableId } }
        date: { gte: $fromDate, lte: $toDate }
        status: { notIn: ["cancelled"] }
      }
      sort: ["date:asc", "startTime:asc"]
    ) {
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

/**
 * Get upcoming reservations (for dashboard/overview)
 */
export const GET_UPCOMING_RESERVATIONS = gql`
  query GetUpcomingReservations($fromDate: Date!, $limit: Int) {
    reservations(
      filters: {
        date: { gte: $fromDate }
        status: { in: ["pending", "confirmed"] }
      }
      sort: ["date:asc", "startTime:asc"]
      pagination: { limit: $limit }
    ) {
      documentId
      date
      startTime
      endTime
      guestCount
      status
      contactName
      contactPhone
      occasion
      table {
        documentId
        number
      }
    }
  }
`;
