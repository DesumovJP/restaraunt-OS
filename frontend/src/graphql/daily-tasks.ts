import { gql } from 'urql';

// ==========================================
// FRAGMENTS
// ==========================================

export const TASK_USER_FRAGMENT = gql`
  fragment TaskUserFields on UsersPermissionsUser {
    documentId
    username
    email
    systemRole
    department
    station
    avatarUrl
    firstName
    lastName
  }
`;

export const DAILY_TASK_FRAGMENT = gql`
  fragment DailyTaskFields on DailyTask {
    documentId
    title
    description
    status
    priority
    category
    dueDate
    dueTime
    isRecurring
    recurringPattern
    station
    estimatedMinutes
    actualMinutes
    notes
    startedAt
    completedAt
    createdAt
    updatedAt
    assignee {
      ...TaskUserFields
    }
    createdByUser {
      ...TaskUserFields
    }
    completedByUser {
      ...TaskUserFields
    }
    parentTask {
      documentId
    }
    subtasks {
      documentId
      title
      status
    }
  }
  ${TASK_USER_FRAGMENT}
`;

// ==========================================
// QUERIES
// ==========================================

export const GET_DAILY_TASKS = gql`
  query GetDailyTasks(
    $filters: DailyTaskFiltersInput
    $pagination: PaginationArg
    $sort: [String]
  ) {
    dailyTasks(filters: $filters, pagination: $pagination, sort: $sort) {
      ...DailyTaskFields
    }
  }
  ${DAILY_TASK_FRAGMENT}
`;

export const GET_MY_TASKS_TODAY = gql`
  query GetMyTasksToday($userId: ID!, $today: Date) {
    dailyTasks(
      filters: {
        assignee: { documentId: { eq: $userId } }
        or: [
          { dueDate: { eq: $today } }
          { dueDate: { null: true }, isRecurring: { eq: true } }
          { status: { in: ["pending", "in_progress"] } }
        ]
      }
      sort: ["priority:desc", "dueTime:asc", "createdAt:asc"]
      pagination: { limit: 100 }
    ) {
      ...DailyTaskFields
    }
  }
  ${DAILY_TASK_FRAGMENT}
`;

export const GET_TEAM_TASKS = gql`
  query GetTeamTasks($date: Date, $station: [String]) {
    dailyTasks(
      filters: {
        or: [
          { dueDate: { eq: $date } }
          { status: { in: ["pending", "in_progress"] } }
        ]
        station: { in: $station }
      }
      sort: ["priority:desc", "dueTime:asc"]
      pagination: { limit: 200 }
    ) {
      ...DailyTaskFields
    }
  }
  ${DAILY_TASK_FRAGMENT}
`;

export const GET_TASK_BY_ID = gql`
  query GetTaskById($documentId: ID!) {
    dailyTask(documentId: $documentId) {
      ...DailyTaskFields
    }
  }
  ${DAILY_TASK_FRAGMENT}
`;

export const GET_USERS_FOR_ASSIGNMENT = gql`
  query GetUsersForAssignment($roles: [String]) {
    usersPermissionsUsers(
      filters: {
        isActive: { eq: true }
        systemRole: { in: $roles }
      }
      sort: ["systemRole:asc", "username:asc"]
      pagination: { limit: 100 }
    ) {
      ...TaskUserFields
    }
  }
  ${TASK_USER_FRAGMENT}
`;

// ==========================================
// MUTATIONS
// ==========================================

export const CREATE_DAILY_TASK = gql`
  mutation CreateDailyTask($data: DailyTaskInput!) {
    createDailyTask(data: $data) {
      ...DailyTaskFields
    }
  }
  ${DAILY_TASK_FRAGMENT}
`;

export const UPDATE_DAILY_TASK = gql`
  mutation UpdateDailyTask($documentId: ID!, $data: DailyTaskInput!) {
    updateDailyTask(documentId: $documentId, data: $data) {
      ...DailyTaskFields
    }
  }
  ${DAILY_TASK_FRAGMENT}
`;

export const DELETE_DAILY_TASK = gql`
  mutation DeleteDailyTask($documentId: ID!) {
    deleteDailyTask(documentId: $documentId) {
      documentId
    }
  }
`;

// ==========================================
// CUSTOM MUTATIONS (REST-based)
// ==========================================

// These are called via REST API, not GraphQL
// See hooks/use-daily-tasks.ts for implementation
