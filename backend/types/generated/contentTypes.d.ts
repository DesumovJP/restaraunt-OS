import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiActionHistoryActionHistory
  extends Struct.CollectionTypeSchema {
  collectionName: 'action_histories';
  info: {
    displayName: 'Action History';
    pluralName: 'action-histories';
    singularName: 'action-history';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    action: Schema.Attribute.Enumeration<
      [
        'create',
        'update',
        'delete',
        'start',
        'complete',
        'cancel',
        'receive',
        'write_off',
        'transfer',
        'login',
        'logout',
        'approve',
        'reject',
        'assign',
        'unassign',
      ]
    > &
      Schema.Attribute.Required;
    changedFields: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dataAfter: Schema.Attribute.JSON;
    dataBefore: Schema.Attribute.JSON;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    descriptionUk: Schema.Attribute.Text;
    entityId: Schema.Attribute.String & Schema.Attribute.Required;
    entityName: Schema.Attribute.String;
    entityType: Schema.Attribute.Enumeration<
      [
        'order',
        'order_item',
        'kitchen_ticket',
        'menu_item',
        'menu_category',
        'ingredient',
        'stock_batch',
        'inventory_movement',
        'recipe',
        'table',
        'reservation',
        'scheduled_order',
        'daily_task',
        'user',
        'supplier',
        'worker_performance',
      ]
    > &
      Schema.Attribute.Required;
    ipAddress: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::action-history.action-history'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    module: Schema.Attribute.Enumeration<
      ['pos', 'kitchen', 'storage', 'admin', 'reservations', 'system']
    > &
      Schema.Attribute.DefaultTo<'system'>;
    performedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    performedByName: Schema.Attribute.String;
    performedByRole: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    severity: Schema.Attribute.Enumeration<['info', 'warning', 'critical']> &
      Schema.Attribute.DefaultTo<'info'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userAgent: Schema.Attribute.String;
  };
}

export interface ApiDailyTaskDailyTask extends Struct.CollectionTypeSchema {
  collectionName: 'daily_tasks';
  info: {
    description: 'Employee daily tasks and assignments';
    displayName: 'Daily Task';
    pluralName: 'daily-tasks';
    singularName: 'daily-task';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    actualMinutes: Schema.Attribute.Integer;
    assignee: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    category: Schema.Attribute.Enumeration<
      [
        'prep',
        'cleaning',
        'inventory',
        'maintenance',
        'training',
        'admin',
        'service',
        'other',
      ]
    > &
      Schema.Attribute.DefaultTo<'other'>;
    completedAt: Schema.Attribute.DateTime;
    completedByUser: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    createdByUser: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    description: Schema.Attribute.Text;
    dueDate: Schema.Attribute.Date;
    dueTime: Schema.Attribute.Time;
    estimatedMinutes: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    isRecurring: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::daily-task.daily-task'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    parentTask: Schema.Attribute.Relation<
      'manyToOne',
      'api::daily-task.daily-task'
    >;
    priority: Schema.Attribute.Enumeration<
      ['low', 'normal', 'high', 'urgent']
    > &
      Schema.Attribute.DefaultTo<'normal'>;
    publishedAt: Schema.Attribute.DateTime;
    recurringPattern: Schema.Attribute.Enumeration<
      ['daily', 'weekdays', 'weekly', 'monthly']
    >;
    startedAt: Schema.Attribute.DateTime;
    station: Schema.Attribute.Enumeration<
      [
        'grill',
        'fry',
        'salad',
        'hot',
        'dessert',
        'bar',
        'pass',
        'prep',
        'front',
        'back',
      ]
    >;
    status: Schema.Attribute.Enumeration<
      ['pending', 'in_progress', 'completed', 'cancelled', 'overdue']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    subtasks: Schema.Attribute.Relation<
      'oneToMany',
      'api::daily-task.daily-task'
    >;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiIngredientIngredient extends Struct.CollectionTypeSchema {
  collectionName: 'ingredients';
  info: {
    displayName: 'Ingredient';
    pluralName: 'ingredients';
    singularName: 'ingredient';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    barcode: Schema.Attribute.String;
    costPerUnit: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currentStock: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ingredient.ingredient'
    > &
      Schema.Attribute.Private;
    mainCategory: Schema.Attribute.Enumeration<
      [
        'raw',
        'prep',
        'dry-goods',
        'seasonings',
        'oils-fats',
        'dairy',
        'beverages',
        'frozen',
        'ready-made',
      ]
    >;
    maxStock: Schema.Attribute.Decimal;
    minStock: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    nameUk: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    shelfLifeDays: Schema.Attribute.Integer;
    sku: Schema.Attribute.String & Schema.Attribute.Unique;
    slug: Schema.Attribute.UID<'name'>;
    stockBatches: Schema.Attribute.Relation<
      'oneToMany',
      'api::stock-batch.stock-batch'
    >;
    storageCondition: Schema.Attribute.Enumeration<
      ['ambient', 'refrigerated', 'frozen', 'dry-cool']
    > &
      Schema.Attribute.DefaultTo<'ambient'>;
    subCategory: Schema.Attribute.String;
    suppliers: Schema.Attribute.Relation<
      'manyToMany',
      'api::supplier.supplier'
    >;
    unit: Schema.Attribute.Enumeration<
      ['kg', 'g', 'l', 'ml', 'pcs', 'portion']
    > &
      Schema.Attribute.DefaultTo<'kg'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    yieldProfile: Schema.Attribute.Relation<
      'oneToOne',
      'api::yield-profile.yield-profile'
    >;
  };
}

export interface ApiInventoryMovementInventoryMovement
  extends Struct.CollectionTypeSchema {
  collectionName: 'inventory_movements';
  info: {
    displayName: 'Inventory Movement';
    pluralName: 'inventory-movements';
    singularName: 'inventory-movement';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    grossQuantity: Schema.Attribute.Decimal;
    ingredient: Schema.Attribute.Relation<
      'manyToOne',
      'api::ingredient.ingredient'
    >;
    kitchenTicket: Schema.Attribute.Relation<
      'manyToOne',
      'api::kitchen-ticket.kitchen-ticket'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-movement.inventory-movement'
    > &
      Schema.Attribute.Private;
    movementType: Schema.Attribute.Enumeration<
      [
        'receive',
        'recipe_use',
        'process',
        'write_off',
        'transfer',
        'adjust',
        'return',
        'reserve',
        'release',
      ]
    >;
    netQuantity: Schema.Attribute.Decimal;
    notes: Schema.Attribute.Text;
    operator: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Decimal & Schema.Attribute.Required;
    reason: Schema.Attribute.String;
    reasonCode: Schema.Attribute.String;
    stockBatch: Schema.Attribute.Relation<
      'manyToOne',
      'api::stock-batch.stock-batch'
    >;
    totalCost: Schema.Attribute.Decimal;
    unit: Schema.Attribute.Enumeration<
      ['kg', 'g', 'l', 'ml', 'pcs', 'portion']
    >;
    unitCost: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    wasteFactor: Schema.Attribute.Decimal;
  };
}

export interface ApiKitchenTicketKitchenTicket
  extends Struct.CollectionTypeSchema {
  collectionName: 'kitchen_tickets';
  info: {
    displayName: 'Kitchen Ticket';
    pluralName: 'kitchen-tickets';
    singularName: 'kitchen-ticket';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assignedChef: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    completedAt: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    elapsedSeconds: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    events: Schema.Attribute.Relation<
      'oneToMany',
      'api::ticket-event.ticket-event'
    >;
    inventoryLocked: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    inventoryMovements: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-movement.inventory-movement'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitchen-ticket.kitchen-ticket'
    > &
      Schema.Attribute.Private;
    order: Schema.Attribute.Relation<'manyToOne', 'api::order.order'>;
    orderItem: Schema.Attribute.Relation<
      'oneToOne',
      'api::order-item.order-item'
    >;
    pickupWaitSeconds: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    priority: Schema.Attribute.Enumeration<['normal', 'rush', 'vip']> &
      Schema.Attribute.DefaultTo<'normal'>;
    priorityScore: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    servedAt: Schema.Attribute.DateTime;
    startedAt: Schema.Attribute.DateTime;
    station: Schema.Attribute.Enumeration<
      ['grill', 'fry', 'salad', 'hot', 'dessert', 'bar', 'pass', 'prep']
    >;
    status: Schema.Attribute.Enumeration<
      [
        'queued',
        'started',
        'paused',
        'resumed',
        'ready',
        'served',
        'failed',
        'cancelled',
      ]
    > &
      Schema.Attribute.DefaultTo<'queued'>;
    ticketNumber: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMenuCategoryMenuCategory
  extends Struct.CollectionTypeSchema {
  collectionName: 'menu_categories';
  info: {
    displayName: 'Menu Category';
    pluralName: 'menu-categories';
    singularName: 'menu-category';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    icon: Schema.Attribute.String;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-category.menu-category'
    > &
      Schema.Attribute.Private;
    menuItems: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-item.menu-item'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    nameUk: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'>;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMenuItemMenuItem extends Struct.CollectionTypeSchema {
  collectionName: 'menu_items';
  info: {
    displayName: 'Menu Item';
    pluralName: 'menu-items';
    singularName: 'menu-item';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    allergens: Schema.Attribute.JSON;
    available: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    category: Schema.Attribute.Relation<
      'manyToOne',
      'api::menu-category.menu-category'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    descriptionUk: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-item.menu-item'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    nameUk: Schema.Attribute.String;
    outputType: Schema.Attribute.Enumeration<
      ['kitchen', 'bar', 'pastry', 'cold']
    > &
      Schema.Attribute.DefaultTo<'kitchen'>;
    portionSize: Schema.Attribute.Decimal;
    portionsPerRecipe: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    portionUnit: Schema.Attribute.Enumeration<['g', 'ml', 'pcs']> &
      Schema.Attribute.DefaultTo<'g'>;
    preparationTime: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<15>;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    primaryStation: Schema.Attribute.Enumeration<
      ['grill', 'fry', 'salad', 'hot', 'dessert', 'bar', 'pass', 'prep']
    > &
      Schema.Attribute.DefaultTo<'hot'>;
    publishedAt: Schema.Attribute.DateTime;
    recipe: Schema.Attribute.Relation<'oneToOne', 'api::recipe.recipe'>;
    servingCourse: Schema.Attribute.Enumeration<
      ['appetizer', 'starter', 'soup', 'main', 'dessert', 'drink']
    > &
      Schema.Attribute.DefaultTo<'main'>;
    slug: Schema.Attribute.UID<'name'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    weight: Schema.Attribute.Integer;
  };
}

export interface ApiOrderItemOrderItem extends Struct.CollectionTypeSchema {
  collectionName: 'order_items';
  info: {
    displayName: 'Order Item';
    pluralName: 'order-items';
    singularName: 'order-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    comment: Schema.Attribute.JSON;
    commentHistory: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    courseIndex: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    courseType: Schema.Attribute.Enumeration<
      ['appetizer', 'starter', 'soup', 'main', 'dessert', 'drink']
    > &
      Schema.Attribute.DefaultTo<'main'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::order-item.order-item'
    > &
      Schema.Attribute.Private;
    menuItem: Schema.Attribute.Relation<
      'manyToOne',
      'api::menu-item.menu-item'
    >;
    modifiers: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    notes: Schema.Attribute.Text;
    order: Schema.Attribute.Relation<'manyToOne', 'api::order.order'>;
    pickupWaitMs: Schema.Attribute.BigInteger & Schema.Attribute.DefaultTo<0>;
    prepElapsedMs: Schema.Attribute.BigInteger & Schema.Attribute.DefaultTo<0>;
    prepStartAt: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1>;
    readyAt: Schema.Attribute.DateTime;
    servedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      [
        'draft',
        'queued',
        'pending',
        'in_progress',
        'ready',
        'served',
        'returned',
        'cancelled',
        'voided',
      ]
    > &
      Schema.Attribute.DefaultTo<'draft'>;
    statusChangedAt: Schema.Attribute.DateTime;
    totalPrice: Schema.Attribute.Decimal;
    unitPrice: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiOrderOrder extends Struct.CollectionTypeSchema {
  collectionName: 'orders';
  info: {
    displayName: 'Order';
    pluralName: 'orders';
    singularName: 'order';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    guestCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    items: Schema.Attribute.Relation<'oneToMany', 'api::order-item.order-item'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::order.order'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    orderNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    paidAt: Schema.Attribute.DateTime;
    paymentMethod: Schema.Attribute.Enumeration<['cash', 'card', 'paylater']>;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['new', 'confirmed', 'in_kitchen', 'ready', 'served', 'cancelled', 'paid']
    > &
      Schema.Attribute.DefaultTo<'new'>;
    table: Schema.Attribute.Relation<'manyToOne', 'api::table.table'>;
    tableStartAt: Schema.Attribute.DateTime;
    taxAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    tickets: Schema.Attribute.Relation<
      'oneToMany',
      'api::kitchen-ticket.kitchen-ticket'
    >;
    tipAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    version: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    waiter: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiRecipeRecipe extends Struct.CollectionTypeSchema {
  collectionName: 'recipes';
  info: {
    displayName: 'Recipe';
    pluralName: 'recipes';
    singularName: 'recipe';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    cookTimeMinutes: Schema.Attribute.Integer;
    costPerPortion: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ingredients: Schema.Attribute.Component<'recipe.recipe-ingredient', true>;
    instructions: Schema.Attribute.RichText;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::recipe.recipe'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    nameUk: Schema.Attribute.String;
    outputType: Schema.Attribute.Enumeration<
      ['kitchen', 'bar', 'pastry', 'cold']
    > &
      Schema.Attribute.DefaultTo<'kitchen'>;
    portionYield: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    prepTimeMinutes: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'>;
    steps: Schema.Attribute.Component<'recipe.recipe-step', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReservationReservation extends Struct.CollectionTypeSchema {
  collectionName: 'reservations';
  info: {
    description: 'Table reservations with time slots';
    displayName: 'Reservation';
    pluralName: 'reservations';
    singularName: 'reservation';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    completedAt: Schema.Attribute.DateTime;
    confirmationCode: Schema.Attribute.String;
    confirmedAt: Schema.Attribute.DateTime;
    contactEmail: Schema.Attribute.Email;
    contactName: Schema.Attribute.String & Schema.Attribute.Required;
    contactPhone: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    endTime: Schema.Attribute.Time & Schema.Attribute.Required;
    guestCount: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<2>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::reservation.reservation'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    occasion: Schema.Attribute.Enumeration<
      ['none', 'birthday', 'anniversary', 'business', 'romantic', 'other']
    >;
    publishedAt: Schema.Attribute.DateTime;
    reminderSentAt: Schema.Attribute.DateTime;
    scheduledOrder: Schema.Attribute.Relation<
      'oneToOne',
      'api::scheduled-order.scheduled-order'
    >;
    seatedAt: Schema.Attribute.DateTime;
    source: Schema.Attribute.Enumeration<
      ['phone', 'walk_in', 'website', 'app', 'third_party']
    > &
      Schema.Attribute.DefaultTo<'phone'>;
    specialRequests: Schema.Attribute.Text;
    startTime: Schema.Attribute.Time & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    table: Schema.Attribute.Relation<'manyToOne', 'api::table.table'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScheduledOrderScheduledOrder
  extends Struct.CollectionTypeSchema {
  collectionName: 'scheduled_orders';
  info: {
    description: 'Pre-planned orders for events, reservations, and HoReCa';
    displayName: 'Scheduled Order';
    pluralName: 'scheduled-orders';
    singularName: 'scheduled-order';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activatedOrder: Schema.Attribute.Relation<'oneToOne', 'api::order.order'>;
    adultsCount: Schema.Attribute.Integer;
    assignedCoordinator: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    cakeDetails: Schema.Attribute.Text;
    checklist: Schema.Attribute.JSON;
    childrenCount: Schema.Attribute.Integer;
    confirmationSentAt: Schema.Attribute.DateTime;
    confirmedAt: Schema.Attribute.DateTime;
    contactCompany: Schema.Attribute.String;
    contactEmail: Schema.Attribute.Email;
    contactName: Schema.Attribute.String;
    contactPhone: Schema.Attribute.String;
    courseTimeline: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    decorations: Schema.Attribute.Text;
    depositAmount: Schema.Attribute.Decimal;
    depositMethod: Schema.Attribute.String;
    depositPaidAt: Schema.Attribute.DateTime;
    dietaryRequirements: Schema.Attribute.JSON;
    eventName: Schema.Attribute.String;
    eventType: Schema.Attribute.Enumeration<
      [
        'regular',
        'birthday',
        'corporate',
        'wedding',
        'anniversary',
        'funeral',
        'baptism',
        'graduation',
        'business',
        'romantic',
        'other',
      ]
    > &
      Schema.Attribute.DefaultTo<'regular'>;
    guestCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    items: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<[]>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::scheduled-order.scheduled-order'
    > &
      Schema.Attribute.Private;
    menuPreset: Schema.Attribute.Enumeration<
      ['a_la_carte', 'set_menu', 'buffet', 'banquet', 'custom']
    > &
      Schema.Attribute.DefaultTo<'a_la_carte'>;
    musicPreference: Schema.Attribute.Text;
    notes: Schema.Attribute.Text;
    paymentStatus: Schema.Attribute.Enumeration<
      ['pending', 'deposit_paid', 'fully_paid', 'refunded']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    prepStartAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    reminderSentAt: Schema.Attribute.DateTime;
    scheduledFor: Schema.Attribute.DateTime & Schema.Attribute.Required;
    seatingArea: Schema.Attribute.Enumeration<
      ['main_hall', 'vip_room', 'terrace', 'private', 'bar_area', 'outdoor']
    > &
      Schema.Attribute.DefaultTo<'main_hall'>;
    status: Schema.Attribute.Enumeration<
      ['scheduled', 'activating', 'activated', 'completed', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'scheduled'>;
    table: Schema.Attribute.Relation<'manyToOne', 'api::table.table'>;
    totalAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiStockBatchStockBatch extends Struct.CollectionTypeSchema {
  collectionName: 'stock_batches';
  info: {
    displayName: 'Stock Batch';
    pluralName: 'stock-batches';
    singularName: 'stock-batch';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    barcode: Schema.Attribute.String;
    batchNumber: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    expiryDate: Schema.Attribute.Date;
    grossIn: Schema.Attribute.Decimal & Schema.Attribute.Required;
    ingredient: Schema.Attribute.Relation<
      'manyToOne',
      'api::ingredient.ingredient'
    >;
    invoiceNumber: Schema.Attribute.String;
    isLocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::stock-batch.stock-batch'
    > &
      Schema.Attribute.Private;
    lockedAt: Schema.Attribute.DateTime;
    lockedBy: Schema.Attribute.String;
    netAvailable: Schema.Attribute.Decimal & Schema.Attribute.Required;
    processes: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    publishedAt: Schema.Attribute.DateTime;
    receivedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      [
        'received',
        'inspecting',
        'processing',
        'available',
        'reserved',
        'depleted',
        'expired',
        'quarantine',
        'written_off',
      ]
    > &
      Schema.Attribute.DefaultTo<'received'>;
    supplier: Schema.Attribute.Relation<'manyToOne', 'api::supplier.supplier'>;
    totalCost: Schema.Attribute.Decimal;
    unitCost: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usedAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    wastedAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiSupplierSupplier extends Struct.CollectionTypeSchema {
  collectionName: 'suppliers';
  info: {
    displayName: 'Supplier';
    pluralName: 'suppliers';
    singularName: 'supplier';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Schema.Attribute.Text;
    contactName: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    ingredients: Schema.Attribute.Relation<
      'manyToMany',
      'api::ingredient.ingredient'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::supplier.supplier'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'>;
    taxId: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTableSessionEventTableSessionEvent
  extends Struct.CollectionTypeSchema {
  collectionName: 'table_session_events';
  info: {
    displayName: 'Table Session Event';
    pluralName: 'table-session-events';
    singularName: 'table-session-event';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    actorName: Schema.Attribute.String;
    actorRole: Schema.Attribute.Enumeration<
      ['waiter', 'chef', 'cashier', 'system']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    durationFromSeatedMs: Schema.Attribute.BigInteger;
    eventType: Schema.Attribute.Enumeration<
      [
        'table_seated',
        'order_taken',
        'item_started',
        'item_ready',
        'item_served',
        'bill_requested',
        'bill_paid',
        'table_cleared',
      ]
    > &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::table-session-event.table-session-event'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    orderDocumentId: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String & Schema.Attribute.Required;
    tableNumber: Schema.Attribute.Integer & Schema.Attribute.Required;
    timestamp: Schema.Attribute.DateTime & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTableTable extends Struct.CollectionTypeSchema {
  collectionName: 'tables';
  info: {
    displayName: 'Table';
    pluralName: 'tables';
    singularName: 'table';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    capacity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<4>;
    closeComment: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currentGuests: Schema.Attribute.Integer;
    freedAt: Schema.Attribute.DateTime;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastCloseReason: Schema.Attribute.Enumeration<
      [
        'normal',
        'mistaken_open',
        'no_show',
        'walkout',
        'emergency',
        'technical_error',
      ]
    >;
    lastSessionDurationMs: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::table.table'> &
      Schema.Attribute.Private;
    mergedWith: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    number: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    occupiedAt: Schema.Attribute.DateTime;
    primaryTableId: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    reservation: Schema.Attribute.Relation<
      'oneToOne',
      'api::reservation.reservation'
    >;
    reservedAt: Schema.Attribute.DateTime;
    reservedBy: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<
      ['free', 'occupied', 'reserved', 'billing']
    > &
      Schema.Attribute.DefaultTo<'free'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    zone: Schema.Attribute.String;
  };
}

export interface ApiTicketEventTicketEvent extends Struct.CollectionTypeSchema {
  collectionName: 'ticket_events';
  info: {
    displayName: 'Ticket Event';
    pluralName: 'ticket-events';
    singularName: 'ticket-event';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    actor: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    eventType: Schema.Attribute.Enumeration<
      [
        'created',
        'started',
        'paused',
        'resumed',
        'completed',
        'served',
        'failed',
        'cancelled',
        'inventory_locked',
        'inventory_released',
      ]
    >;
    kitchenTicket: Schema.Attribute.Relation<
      'manyToOne',
      'api::kitchen-ticket.kitchen-ticket'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ticket-event.ticket-event'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    newStatus: Schema.Attribute.String;
    previousStatus: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    reason: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiWorkerPerformanceWorkerPerformance
  extends Struct.CollectionTypeSchema {
  collectionName: 'worker_performances';
  info: {
    displayName: 'Worker Performance';
    pluralName: 'worker-performances';
    singularName: 'worker-performance';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    avgOrderTimeSeconds: Schema.Attribute.Integer;
    avgTicketTimeSeconds: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    department: Schema.Attribute.Enumeration<
      ['management', 'kitchen', 'service', 'bar', 'none']
    >;
    efficiencyScore: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::worker-performance.worker-performance'
    > &
      Schema.Attribute.Private;
    ordersHandled: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    station: Schema.Attribute.Enumeration<
      [
        'grill',
        'fry',
        'salad',
        'hot',
        'dessert',
        'bar',
        'pass',
        'prep',
        'front',
        'back',
      ]
    >;
    tasksCompleted: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    ticketsCompleted: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    totalActualMinutes: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    totalEstimatedMinutes: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    worker: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiWorkerShiftWorkerShift extends Struct.CollectionTypeSchema {
  collectionName: 'worker_shifts';
  info: {
    displayName: 'Worker Shift';
    pluralName: 'worker-shifts';
    singularName: 'worker-shift';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    actualEndTime: Schema.Attribute.Time;
    actualMinutes: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    actualStartTime: Schema.Attribute.Time;
    approvedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    breakMinutes: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    clockInLocation: Schema.Attribute.String;
    clockOutLocation: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    department: Schema.Attribute.Enumeration<
      ['management', 'kitchen', 'service', 'bar', 'cleaning', 'none']
    > &
      Schema.Attribute.DefaultTo<'none'>;
    endTime: Schema.Attribute.Time & Schema.Attribute.Required;
    hourlyRate: Schema.Attribute.Decimal;
    isHoliday: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::worker-shift.worker-shift'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    overtimeMinutes: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    scheduledMinutes: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    shiftType: Schema.Attribute.Enumeration<
      ['morning', 'afternoon', 'evening', 'night', 'split']
    > &
      Schema.Attribute.DefaultTo<'morning'>;
    startTime: Schema.Attribute.Time & Schema.Attribute.Required;
    station: Schema.Attribute.Enumeration<
      ['grill', 'fry', 'salad', 'hot', 'prep', 'dessert', 'bar', 'pass', 'none']
    > &
      Schema.Attribute.DefaultTo<'none'>;
    status: Schema.Attribute.Enumeration<
      ['scheduled', 'started', 'completed', 'missed', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'scheduled'>;
    totalPay: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    worker: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiYieldProfileYieldProfile
  extends Struct.CollectionTypeSchema {
  collectionName: 'yield_profiles';
  info: {
    displayName: 'Yield Profile';
    pluralName: 'yield-profiles';
    singularName: 'yield-profile';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    baseYieldRatio: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::yield-profile.yield-profile'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    processYields: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    wasteBreakdown: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    avatarUrl: Schema.Attribute.String;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.Enumeration<
      ['management', 'kitchen', 'service', 'bar', 'none']
    > &
      Schema.Attribute.DefaultTo<'none'>;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstName: Schema.Attribute.String;
    hireDate: Schema.Attribute.Date;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastName: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    phone: Schema.Attribute.String;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    station: Schema.Attribute.Enumeration<
      [
        'grill',
        'fry',
        'salad',
        'hot',
        'dessert',
        'bar',
        'pass',
        'prep',
        'front',
        'back',
      ]
    >;
    systemRole: Schema.Attribute.Enumeration<
      [
        'admin',
        'manager',
        'chef',
        'cook',
        'waiter',
        'host',
        'bartender',
        'cashier',
        'viewer',
      ]
    > &
      Schema.Attribute.DefaultTo<'viewer'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::action-history.action-history': ApiActionHistoryActionHistory;
      'api::daily-task.daily-task': ApiDailyTaskDailyTask;
      'api::ingredient.ingredient': ApiIngredientIngredient;
      'api::inventory-movement.inventory-movement': ApiInventoryMovementInventoryMovement;
      'api::kitchen-ticket.kitchen-ticket': ApiKitchenTicketKitchenTicket;
      'api::menu-category.menu-category': ApiMenuCategoryMenuCategory;
      'api::menu-item.menu-item': ApiMenuItemMenuItem;
      'api::order-item.order-item': ApiOrderItemOrderItem;
      'api::order.order': ApiOrderOrder;
      'api::recipe.recipe': ApiRecipeRecipe;
      'api::reservation.reservation': ApiReservationReservation;
      'api::scheduled-order.scheduled-order': ApiScheduledOrderScheduledOrder;
      'api::stock-batch.stock-batch': ApiStockBatchStockBatch;
      'api::supplier.supplier': ApiSupplierSupplier;
      'api::table-session-event.table-session-event': ApiTableSessionEventTableSessionEvent;
      'api::table.table': ApiTableTable;
      'api::ticket-event.ticket-event': ApiTicketEventTicketEvent;
      'api::worker-performance.worker-performance': ApiWorkerPerformanceWorkerPerformance;
      'api::worker-shift.worker-shift': ApiWorkerShiftWorkerShift;
      'api::yield-profile.yield-profile': ApiYieldProfileYieldProfile;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
