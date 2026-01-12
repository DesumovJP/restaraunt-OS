/**
 * Admin GraphQL Queries
 * Queries for action history and administrative functions
 */

import { gql } from "urql";

/**
 * Get action history with filters
 */
export const GET_ACTION_HISTORY = gql`
  query GetActionHistory(
    $fromDate: DateTime
    $toDate: DateTime
    $entityType: String
    $action: String
    $module: String
    $severity: String
    $limit: Int
    $offset: Int
  ) {
    actionHistories(
      filters: {
        createdAt: { gte: $fromDate, lte: $toDate }
        entityType: { eq: $entityType }
        action: { eq: $action }
        module: { eq: $module }
        severity: { eq: $severity }
      }
      sort: ["createdAt:desc"]
      pagination: { limit: $limit, start: $offset }
    ) {
      documentId
      action
      entityType
      entityId
      entityName
      description
      descriptionUk
      dataBefore
      dataAfter
      changedFields
      metadata
      performedByName
      performedByRole
      module
      severity
      createdAt
      performedBy {
        documentId
        username
        firstName
        lastName
      }
    }
  }
`;

/**
 * Get action history count (for pagination)
 */
export const GET_ACTION_HISTORY_COUNT = gql`
  query GetActionHistoryCount(
    $fromDate: DateTime
    $toDate: DateTime
    $entityType: String
    $action: String
    $module: String
  ) {
    actionHistories_connection(
      filters: {
        createdAt: { gte: $fromDate, lte: $toDate }
        entityType: { eq: $entityType }
        action: { eq: $action }
        module: { eq: $module }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

/**
 * Get recent actions (for dashboard widget)
 */
export const GET_RECENT_ACTIONS = gql`
  query GetRecentActions($limit: Int!) {
    actionHistories(
      sort: ["createdAt:desc"]
      pagination: { limit: $limit }
    ) {
      documentId
      action
      entityType
      entityId
      entityName
      description
      descriptionUk
      dataBefore
      dataAfter
      changedFields
      metadata
      performedByName
      performedByRole
      module
      severity
      createdAt
    }
  }
`;
