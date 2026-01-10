import { SystemRole } from '@/lib/rbac';
import { Department, Station } from './daily-tasks';

// ==========================================
// AUTH USER
// ==========================================

export interface AuthUser {
  id: string;
  documentId: string;
  username: string;
  email: string;
  systemRole: SystemRole;
  department: Department;
  station?: Station;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// AUTH STATE
// ==========================================

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ==========================================
// API TYPES
// ==========================================

export interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

export interface LoginResponse {
  jwt: string;
  user: AuthUser;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  systemRole?: SystemRole;
  department?: Department;
}

export interface AuthError {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==========================================
// ROLE DISPLAY
// ==========================================

export const SYSTEM_ROLE_LABELS: Record<SystemRole, { en: string; uk: string }> = {
  admin: { en: 'Administrator', uk: 'Адміністратор' },
  manager: { en: 'Manager', uk: 'Менеджер' },
  chef: { en: 'Head Chef', uk: 'Шеф-кухар' },
  cook: { en: 'Cook', uk: 'Кухар' },
  waiter: { en: 'Waiter', uk: 'Офіціант' },
  host: { en: 'Host', uk: 'Хостес' },
  bartender: { en: 'Bartender', uk: 'Бармен' },
  cashier: { en: 'Cashier', uk: 'Касир' },
  viewer: { en: 'Viewer', uk: 'Переглядач' },
};

export function getUserDisplayName(user: AuthUser | null): string {
  if (!user) return '';

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.username;
}

export function getUserInitials(user: AuthUser | null): string {
  if (!user) return '?';

  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  return user.username[0].toUpperCase();
}
