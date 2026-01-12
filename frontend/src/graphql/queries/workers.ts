/**
 * Workers GraphQL Queries
 * Queries for worker performance, shifts, and scheduling
 */

import { gql } from "urql";

// ==========================================
// WORKER PERFORMANCE
// ==========================================

/**
 * Get worker performance for date range
 */
export const GET_WORKER_PERFORMANCE = gql`
  query GetWorkerPerformance($workerId: ID!, $fromDate: Date!, $toDate: Date!) {
    workerPerformances(
      filters: {
        worker: { documentId: { eq: $workerId } }
        date: { gte: $fromDate, lte: $toDate }
      }
      sort: ["date:desc"]
    ) {
      documentId
      date
      tasksCompleted
      totalEstimatedMinutes
      totalActualMinutes
      ticketsCompleted
      avgTicketTimeSeconds
      ordersHandled
      avgOrderTimeSeconds
      efficiencyScore
      department
      station
      worker {
        documentId
        username
        firstName
        lastName
      }
    }
  }
`;

/**
 * Get team performance for department on a specific date
 */
export const GET_TEAM_PERFORMANCE = gql`
  query GetTeamPerformance($department: String, $date: Date!) {
    workerPerformances(
      filters: {
        department: { eq: $department }
        date: { eq: $date }
      }
      sort: ["efficiencyScore:desc"]
    ) {
      documentId
      date
      tasksCompleted
      totalEstimatedMinutes
      totalActualMinutes
      ticketsCompleted
      avgTicketTimeSeconds
      efficiencyScore
      department
      station
      worker {
        documentId
        username
        firstName
        lastName
        avatarUrl
        systemRole
        station
      }
    }
  }
`;

/**
 * Get all workers performance summary for date range
 */
export const GET_ALL_WORKERS_PERFORMANCE = gql`
  query GetAllWorkersPerformance($fromDate: Date!, $toDate: Date!) {
    workerPerformances(
      filters: {
        date: { gte: $fromDate, lte: $toDate }
      }
      sort: ["date:desc", "efficiencyScore:desc"]
      pagination: { limit: 500 }
    ) {
      documentId
      date
      tasksCompleted
      totalEstimatedMinutes
      totalActualMinutes
      ticketsCompleted
      avgTicketTimeSeconds
      ordersHandled
      avgOrderTimeSeconds
      efficiencyScore
      department
      station
      worker {
        documentId
        username
        firstName
        lastName
        avatarUrl
        systemRole
        department
        station
      }
    }
  }
`;

// ==========================================
// WORKER SHIFTS
// ==========================================

/**
 * Get worker shifts for date range
 */
export const GET_WORKER_SHIFTS = gql`
  query GetWorkerShifts($workerId: ID!, $fromDate: Date!, $toDate: Date!) {
    workerShifts(
      filters: {
        worker: { documentId: { eq: $workerId } }
        date: { gte: $fromDate, lte: $toDate }
      }
      sort: ["date:asc", "startTime:asc"]
    ) {
      documentId
      date
      startTime
      endTime
      shiftType
      status
      actualStartTime
      actualEndTime
      scheduledMinutes
      actualMinutes
      overtimeMinutes
      breakMinutes
      department
      station
      notes
      isHoliday
      hourlyRate
      totalPay
      worker {
        documentId
        username
        firstName
        lastName
      }
      createdBy {
        documentId
        username
      }
    }
  }
`;

/**
 * Get team schedule for date range and optional department
 */
export const GET_TEAM_SCHEDULE = gql`
  query GetTeamSchedule($fromDate: Date!, $toDate: Date!, $department: String) {
    workerShifts(
      filters: {
        date: { gte: $fromDate, lte: $toDate }
        department: { eq: $department }
      }
      sort: ["date:asc", "startTime:asc"]
      pagination: { limit: 500 }
    ) {
      documentId
      date
      startTime
      endTime
      shiftType
      status
      department
      station
      scheduledMinutes
      actualMinutes
      worker {
        documentId
        username
        firstName
        lastName
        avatarUrl
      }
    }
  }
`;

/**
 * Get today's shifts
 */
export const GET_TODAYS_SHIFTS = gql`
  query GetTodaysShifts($date: Date!) {
    workerShifts(
      filters: {
        date: { eq: $date }
      }
      sort: ["startTime:asc"]
    ) {
      documentId
      date
      startTime
      endTime
      shiftType
      status
      actualStartTime
      actualEndTime
      department
      station
      worker {
        documentId
        username
        firstName
        lastName
        avatarUrl
      }
    }
  }
`;

/**
 * Get all workers (for scheduling)
 */
export const GET_ALL_WORKERS = gql`
  query GetAllWorkers {
    usersPermissionsUsers(
      filters: {
        blocked: { eq: false }
      }
      sort: ["firstName:asc", "username:asc"]
      pagination: { limit: 100 }
    ) {
      documentId
      username
      firstName
      lastName
      email
      avatarUrl
      systemRole
      department
      station
      isActive
    }
  }
`;
