/**
 * Role-Based Access Control (RBAC) System
 *
 * Defines roles, permissions, scopes, and field-level guards
 * for sensitive operations.
 */

// ==========================================
// ROLE DEFINITIONS
// ==========================================

export type SystemRole =
  | 'admin'      // Full system access
  | 'manager'    // Restaurant manager
  | 'chef'       // Kitchen staff (head chef)
  | 'cook'       // Kitchen staff (line cook)
  | 'waiter'     // Service staff
  | 'host'       // Front desk
  | 'bartender'  // Bar staff
  | 'cashier'    // Payment processing
  | 'viewer';    // Read-only access

export interface RoleDefinition {
  role: SystemRole;
  name: string;
  nameUk: string;
  description: string;
  level: number;          // Hierarchy level (higher = more access)
  department: string;
  inheritsFrom?: SystemRole[];
}

export const ROLES: Record<SystemRole, RoleDefinition> = {
  admin: {
    role: 'admin',
    name: 'Administrator',
    nameUk: 'Адміністратор',
    description: 'Full system access, all permissions',
    level: 100,
    department: 'management',
  },
  manager: {
    role: 'manager',
    name: 'Manager',
    nameUk: 'Менеджер',
    description: 'Restaurant management, approvals, reports',
    level: 80,
    department: 'management',
    inheritsFrom: ['chef', 'waiter', 'bartender', 'cashier'],
  },
  chef: {
    role: 'chef',
    name: 'Head Chef',
    nameUk: 'Шеф-кухар',
    description: 'Kitchen management, recipes, inventory',
    level: 60,
    department: 'kitchen',
    inheritsFrom: ['cook'],
  },
  cook: {
    role: 'cook',
    name: 'Line Cook',
    nameUk: 'Кухар',
    description: 'Food preparation, station work',
    level: 40,
    department: 'kitchen',
  },
  waiter: {
    role: 'waiter',
    name: 'Waiter',
    nameUk: 'Офіціант',
    description: 'Order taking, table service',
    level: 40,
    department: 'service',
  },
  host: {
    role: 'host',
    name: 'Host',
    nameUk: 'Хостес',
    description: 'Reservations, seating',
    level: 30,
    department: 'service',
  },
  bartender: {
    role: 'bartender',
    name: 'Bartender',
    nameUk: 'Бармен',
    description: 'Bar service, drinks',
    level: 40,
    department: 'bar',
  },
  cashier: {
    role: 'cashier',
    name: 'Cashier',
    nameUk: 'Касир',
    description: 'Payment processing',
    level: 35,
    department: 'service',
  },
  viewer: {
    role: 'viewer',
    name: 'Viewer',
    nameUk: 'Переглядач',
    description: 'Read-only access',
    level: 10,
    department: 'none',
  },
};

// ==========================================
// PERMISSION DEFINITIONS
// ==========================================

export type PermissionScope =
  | 'orders'
  | 'order_items'
  | 'tables'
  | 'bills'
  | 'storage'
  | 'batches'
  | 'recipes'
  | 'profiles'
  | 'reports'
  | 'settings'
  | 'audit';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'undo'
  | 'export'
  | 'configure';

export interface Permission {
  scope: PermissionScope;
  action: PermissionAction;
  resourceFilter?: string;    // e.g., "own" for own orders only
  fieldRestrictions?: string[]; // Fields that cannot be accessed
  requiresReason?: boolean;
  requiresApproval?: SystemRole[];
  auditLevel?: 'info' | 'warning' | 'critical';
}

export type PermissionKey = `${PermissionScope}:${PermissionAction}`;

// ==========================================
// ROLE PERMISSIONS MATRIX
// ==========================================

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  admin: [
    // Full access to everything
    { scope: 'orders', action: 'create' },
    { scope: 'orders', action: 'read' },
    { scope: 'orders', action: 'update' },
    { scope: 'orders', action: 'delete', requiresReason: true, auditLevel: 'critical' },
    { scope: 'orders', action: 'approve' },
    { scope: 'orders', action: 'undo' },
    { scope: 'order_items', action: 'create' },
    { scope: 'order_items', action: 'read' },
    { scope: 'order_items', action: 'update' },
    { scope: 'order_items', action: 'delete' },
    { scope: 'order_items', action: 'undo' },
    { scope: 'tables', action: 'create' },
    { scope: 'tables', action: 'read' },
    { scope: 'tables', action: 'update' },
    { scope: 'tables', action: 'delete' },
    { scope: 'bills', action: 'create' },
    { scope: 'bills', action: 'read' },
    { scope: 'bills', action: 'update' },
    { scope: 'bills', action: 'approve' },
    { scope: 'storage', action: 'create' },
    { scope: 'storage', action: 'read' },
    { scope: 'storage', action: 'update' },
    { scope: 'storage', action: 'delete', requiresReason: true },
    { scope: 'storage', action: 'approve' },
    { scope: 'batches', action: 'create' },
    { scope: 'batches', action: 'read' },
    { scope: 'batches', action: 'update' },
    { scope: 'batches', action: 'delete', requiresReason: true, auditLevel: 'critical' },
    { scope: 'batches', action: 'approve' },
    { scope: 'recipes', action: 'create' },
    { scope: 'recipes', action: 'read' },
    { scope: 'recipes', action: 'update' },
    { scope: 'recipes', action: 'delete' },
    { scope: 'profiles', action: 'create' },
    { scope: 'profiles', action: 'read' },
    { scope: 'profiles', action: 'update' },
    { scope: 'profiles', action: 'delete' },
    { scope: 'reports', action: 'read' },
    { scope: 'reports', action: 'export' },
    { scope: 'settings', action: 'read' },
    { scope: 'settings', action: 'configure' },
    { scope: 'audit', action: 'read' },
    { scope: 'audit', action: 'export' },
  ],

  manager: [
    { scope: 'orders', action: 'create' },
    { scope: 'orders', action: 'read' },
    { scope: 'orders', action: 'update' },
    { scope: 'orders', action: 'approve' },
    { scope: 'orders', action: 'undo', requiresReason: true, auditLevel: 'warning' },
    { scope: 'order_items', action: 'create' },
    { scope: 'order_items', action: 'read' },
    { scope: 'order_items', action: 'update' },
    { scope: 'order_items', action: 'undo', requiresReason: true },
    { scope: 'tables', action: 'create' },
    { scope: 'tables', action: 'read' },
    { scope: 'tables', action: 'update' },
    { scope: 'bills', action: 'create' },
    { scope: 'bills', action: 'read' },
    { scope: 'bills', action: 'update' },
    { scope: 'bills', action: 'approve' },
    { scope: 'storage', action: 'create' },
    { scope: 'storage', action: 'read' },
    { scope: 'storage', action: 'update' },
    { scope: 'storage', action: 'approve' },
    { scope: 'batches', action: 'create' },
    { scope: 'batches', action: 'read' },
    { scope: 'batches', action: 'update' },
    { scope: 'batches', action: 'approve' },
    { scope: 'recipes', action: 'read' },
    { scope: 'recipes', action: 'update' },
    { scope: 'profiles', action: 'read' },
    { scope: 'profiles', action: 'update', resourceFilter: 'department' },
    { scope: 'reports', action: 'read' },
    { scope: 'reports', action: 'export' },
    { scope: 'audit', action: 'read' },
  ],

  chef: [
    { scope: 'orders', action: 'read' },
    { scope: 'order_items', action: 'read' },
    { scope: 'order_items', action: 'update', fieldRestrictions: ['price', 'quantity'] },
    { scope: 'order_items', action: 'undo', requiresReason: true, auditLevel: 'warning' },
    { scope: 'tables', action: 'read' },
    { scope: 'storage', action: 'create' },
    { scope: 'storage', action: 'read' },
    { scope: 'storage', action: 'update' },
    { scope: 'batches', action: 'create' },
    { scope: 'batches', action: 'read' },
    { scope: 'batches', action: 'update' },
    { scope: 'recipes', action: 'create' },
    { scope: 'recipes', action: 'read' },
    { scope: 'recipes', action: 'update' },
    { scope: 'profiles', action: 'read', resourceFilter: 'own' },
    { scope: 'reports', action: 'read', resourceFilter: 'kitchen' },
  ],

  cook: [
    { scope: 'orders', action: 'read' },
    { scope: 'order_items', action: 'read' },
    { scope: 'order_items', action: 'update', fieldRestrictions: ['price', 'quantity', 'courseType'] },
    { scope: 'tables', action: 'read' },
    { scope: 'storage', action: 'read' },
    { scope: 'batches', action: 'read' },
    { scope: 'batches', action: 'update', fieldRestrictions: ['unitCost', 'totalCost'] },
    { scope: 'recipes', action: 'read' },
    { scope: 'profiles', action: 'read', resourceFilter: 'own' },
  ],

  waiter: [
    { scope: 'orders', action: 'create' },
    { scope: 'orders', action: 'read', resourceFilter: 'own' },
    { scope: 'orders', action: 'update', resourceFilter: 'own' },
    { scope: 'order_items', action: 'create' },
    { scope: 'order_items', action: 'read' },
    { scope: 'order_items', action: 'update', fieldRestrictions: ['status'] }, // Cannot change cooking status
    { scope: 'tables', action: 'read' },
    { scope: 'tables', action: 'update', fieldRestrictions: ['capacity'] },
    { scope: 'bills', action: 'create' },
    { scope: 'bills', action: 'read', resourceFilter: 'own' },
    { scope: 'bills', action: 'update', resourceFilter: 'own' },
    { scope: 'profiles', action: 'read', resourceFilter: 'own' },
  ],

  host: [
    { scope: 'tables', action: 'read' },
    { scope: 'tables', action: 'update' },
    { scope: 'orders', action: 'read' },
    { scope: 'profiles', action: 'read', resourceFilter: 'own' },
  ],

  bartender: [
    { scope: 'orders', action: 'read' },
    { scope: 'order_items', action: 'read' },
    { scope: 'order_items', action: 'update', fieldRestrictions: ['price', 'quantity'] },
    { scope: 'storage', action: 'read', resourceFilter: 'bar' },
    { scope: 'batches', action: 'read', resourceFilter: 'bar' },
    { scope: 'profiles', action: 'read', resourceFilter: 'own' },
  ],

  cashier: [
    { scope: 'orders', action: 'read' },
    { scope: 'bills', action: 'read' },
    { scope: 'bills', action: 'update' },
    { scope: 'profiles', action: 'read', resourceFilter: 'own' },
  ],

  viewer: [
    { scope: 'orders', action: 'read' },
    { scope: 'tables', action: 'read' },
    { scope: 'storage', action: 'read' },
    { scope: 'reports', action: 'read' },
  ],
};

// ==========================================
// PERMISSION CHECKING
// ==========================================

export interface PermissionCheckContext {
  actorRole: SystemRole;
  actorId: string;
  resourceOwnerId?: string;
  resourceDepartment?: string;
  resourceFields?: string[];
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiresReason?: boolean;
  requiresApproval?: SystemRole[];
  auditLevel?: 'info' | 'warning' | 'critical';
  restrictedFields?: string[];
}

export function checkPermission(
  scope: PermissionScope,
  action: PermissionAction,
  context: PermissionCheckContext
): PermissionCheckResult {
  const rolePermissions = ROLE_PERMISSIONS[context.actorRole];

  if (!rolePermissions) {
    return { allowed: false, reason: 'Unknown role' };
  }

  // Find matching permission
  const permission = rolePermissions.find(
    (p) => p.scope === scope && p.action === action
  );

  if (!permission) {
    return { allowed: false, reason: `No ${action} permission for ${scope}` };
  }

  // Check resource filter
  if (permission.resourceFilter) {
    switch (permission.resourceFilter) {
      case 'own':
        if (context.resourceOwnerId && context.resourceOwnerId !== context.actorId) {
          return { allowed: false, reason: 'Can only access own resources' };
        }
        break;
      case 'department':
        const actorDept = ROLES[context.actorRole].department;
        if (context.resourceDepartment && context.resourceDepartment !== actorDept) {
          return { allowed: false, reason: 'Can only access resources in own department' };
        }
        break;
    }
  }

  // Check field restrictions
  let restrictedFields: string[] | undefined;
  if (permission.fieldRestrictions && context.resourceFields) {
    restrictedFields = context.resourceFields.filter((f) =>
      permission.fieldRestrictions!.includes(f)
    );
    if (restrictedFields.length > 0) {
      return {
        allowed: true,
        restrictedFields,
        requiresReason: permission.requiresReason,
        requiresApproval: permission.requiresApproval,
        auditLevel: permission.auditLevel,
      };
    }
  }

  return {
    allowed: true,
    requiresReason: permission.requiresReason,
    requiresApproval: permission.requiresApproval,
    auditLevel: permission.auditLevel,
  };
}

// ==========================================
// FIELD-LEVEL GUARDS
// ==========================================

export interface FieldGuard {
  field: string;
  readRoles: SystemRole[];
  writeRoles: SystemRole[];
  requiresApproval?: SystemRole[];
  maskForRoles?: SystemRole[];
  auditOnChange?: boolean;
}

export const SENSITIVE_FIELD_GUARDS: Record<string, FieldGuard[]> = {
  OrderItem: [
    {
      field: 'price',
      readRoles: ['admin', 'manager', 'waiter', 'cashier'],
      writeRoles: ['admin', 'manager'],
      auditOnChange: true,
    },
    {
      field: 'costPrice',
      readRoles: ['admin', 'manager'],
      writeRoles: ['admin'],
      maskForRoles: ['waiter', 'cook', 'bartender'],
    },
  ],
  StorageBatch: [
    {
      field: 'unitCost',
      readRoles: ['admin', 'manager', 'chef'],
      writeRoles: ['admin', 'manager'],
      maskForRoles: ['cook', 'waiter'],
      auditOnChange: true,
    },
    {
      field: 'totalCost',
      readRoles: ['admin', 'manager', 'chef'],
      writeRoles: ['admin', 'manager'],
      auditOnChange: true,
    },
  ],
  YieldProfile: [
    {
      field: 'baseYieldRatio',
      readRoles: ['admin', 'manager', 'chef', 'cook'],
      writeRoles: ['admin', 'manager'],
      requiresApproval: ['admin'],
      auditOnChange: true,
    },
  ],
  EmployeeProfile: [
    {
      field: 'salary',
      readRoles: ['admin'],
      writeRoles: ['admin'],
      maskForRoles: ['manager', 'chef', 'waiter'],
    },
    {
      field: 'contactInfo.emergencyContact',
      readRoles: ['admin', 'manager'],
      writeRoles: ['admin', 'manager'],
    },
  ],
};

export function checkFieldAccess(
  entityType: string,
  field: string,
  action: 'read' | 'write',
  role: SystemRole
): { allowed: boolean; masked?: boolean; requiresApproval?: SystemRole[] } {
  const guards = SENSITIVE_FIELD_GUARDS[entityType];
  if (!guards) return { allowed: true };

  const guard = guards.find((g) => g.field === field);
  if (!guard) return { allowed: true };

  if (action === 'read') {
    if (guard.maskForRoles?.includes(role)) {
      return { allowed: true, masked: true };
    }
    return { allowed: guard.readRoles.includes(role) };
  }

  if (action === 'write') {
    return {
      allowed: guard.writeRoles.includes(role),
      requiresApproval: guard.requiresApproval,
    };
  }

  return { allowed: false };
}

// ==========================================
// API ERROR RESPONSES
// ==========================================

export interface RBACError {
  code: string;
  message: string;
  messageUk: string;
  details?: {
    requiredRole?: SystemRole[];
    requiredPermission?: string;
    restrictedFields?: string[];
  };
}

export const RBAC_ERRORS = {
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    messageUk: 'Потрібна автентифікація',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'You do not have permission to perform this action',
    messageUk: 'У вас немає дозволу на цю дію',
  },
  INSUFFICIENT_ROLE: {
    code: 'INSUFFICIENT_ROLE',
    message: 'This action requires a higher role level',
    messageUk: 'Ця дія потребує вищого рівня ролі',
  },
  APPROVAL_REQUIRED: {
    code: 'APPROVAL_REQUIRED',
    message: 'This action requires approval from a manager',
    messageUk: 'Ця дія потребує схвалення менеджера',
  },
  REASON_REQUIRED: {
    code: 'REASON_REQUIRED',
    message: 'A reason must be provided for this action',
    messageUk: 'Для цієї дії потрібно вказати причину',
  },
  FIELD_RESTRICTED: {
    code: 'FIELD_RESTRICTED',
    message: 'You cannot modify one or more fields',
    messageUk: 'Ви не можете змінити одне або кілька полів',
  },
  RESOURCE_NOT_OWNED: {
    code: 'RESOURCE_NOT_OWNED',
    message: 'You can only access your own resources',
    messageUk: 'Ви можете отримати доступ лише до власних ресурсів',
  },
} as const;
