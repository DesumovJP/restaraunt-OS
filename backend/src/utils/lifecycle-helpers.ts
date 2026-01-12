/**
 * Lifecycle Helpers for Restaurant OS
 *
 * Provides enhanced factory functions for creating Strapi lifecycle hooks
 * with action logging. Extends the base createActionLoggerLifecycles from
 * action-logger.ts with more configuration options.
 */

import { logAction } from './action-logger';
import type { Module, SeverityLevel } from './enums';

// ==========================================
// TYPES
// ==========================================

interface LifecycleEvent {
  params: {
    where?: { documentId?: string };
    data?: Record<string, unknown>;
  };
  result?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

type MetadataExtractor = (entity: Record<string, unknown>) => Record<string, unknown>;
type PopulateConfig = string | string[] | Record<string, unknown>;
type NameGetter = (entity: Record<string, unknown>) => string | null;

interface EnhancedLifecycleOptions {
  /** Entity type name for logging (e.g., 'ingredient', 'menu_category') */
  entityType: string;

  /** API name for Strapi documents API (e.g., 'menu-category'). Defaults to entityType. */
  apiName?: string;

  /** Module this entity belongs to */
  module: Module;

  /** Function to extract entity name for logging */
  getEntityName?: NameGetter;

  /** Populate config for fetching related data */
  populate?: PopulateConfig;

  /** Function to extract custom metadata from entity */
  getMetadata?: MetadataExtractor;

  /** Function to extract metadata on update (has access to both original and updated) */
  getUpdateMetadata?: (
    original: Record<string, unknown> | null,
    updated: Record<string, unknown>
  ) => Record<string, unknown>;

  /** Function to extract metadata on delete */
  getDeleteMetadata?: MetadataExtractor;

  /** Severity for delete actions (default: 'warning') */
  deleteSeverity?: SeverityLevel;

  /** Custom description generator */
  getDescription?: (action: string, entity: Record<string, unknown>) => string;

  /** Skip logging for certain actions */
  skipActions?: Array<'create' | 'update' | 'delete'>;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get document ID from API path
 */
function getApiPath(entityType: string): string {
  return `api::${entityType}.${entityType}`;
}

/**
 * Default name getter - tries common name fields
 */
const defaultNameGetter: NameGetter = (entity) => {
  return (
    (entity.name as string) ||
    (entity.title as string) ||
    (entity.orderNumber as string) ||
    (entity.ticketNumber as string) ||
    null
  );
};

/**
 * Generate default description
 */
function generateDescription(
  action: string,
  entityType: string,
  entityName?: string | null
): string {
  const actionVerbs: Record<string, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
  };
  const verb = actionVerbs[action] || action;
  return entityName
    ? `${verb} ${entityType}: ${entityName}`
    : `${verb} ${entityType}`;
}

// ==========================================
// ENHANCED FACTORY FUNCTION
// ==========================================

/**
 * Create enhanced lifecycle hooks with full configuration options.
 *
 * @example
 * // Simple usage
 * export default createEnhancedLifecycles({
 *   entityType: 'ingredient',
 *   module: 'storage',
 * });
 *
 * @example
 * // With custom metadata
 * export default createEnhancedLifecycles({
 *   entityType: 'supplier',
 *   module: 'storage',
 *   getMetadata: (entity) => ({
 *     name: entity.name,
 *     contactName: entity.contactName,
 *     isActive: entity.isActive,
 *   }),
 * });
 *
 * @example
 * // With populate
 * export default createEnhancedLifecycles({
 *   entityType: 'recipe',
 *   module: 'admin',
 *   populate: ['ingredients', 'steps'],
 *   getMetadata: (entity) => ({
 *     ingredientsCount: entity.ingredients?.length || 0,
 *     stepsCount: entity.steps?.length || 0,
 *   }),
 * });
 */
export function createEnhancedLifecycles(options: EnhancedLifecycleOptions) {
  const {
    entityType,
    apiName,
    module,
    getEntityName = defaultNameGetter,
    populate,
    getMetadata,
    getUpdateMetadata,
    getDeleteMetadata,
    deleteSeverity = 'warning',
    getDescription,
    skipActions = [],
  } = options;

  const apiPath = getApiPath(apiName || entityType);
  const shouldLog = (action: 'create' | 'update' | 'delete') =>
    !skipActions.includes(action);

  // Helper to fetch entity with populate
  async function fetchEntity(documentId: string): Promise<Record<string, unknown> | null> {
    try {
      return await (strapi as any).documents(apiPath).findOne({
        documentId,
        ...(populate && { populate }),
      });
    } catch {
      return null;
    }
  }

  return {
    async beforeUpdate(event: LifecycleEvent) {
      if (!shouldLog('update')) return;

      const { where } = event.params;
      if (where?.documentId) {
        const original = await fetchEntity(where.documentId);
        event.state = { original };
      }
    },

    async afterCreate(event: LifecycleEvent) {
      if (!shouldLog('create')) return;

      const { result } = event;
      if (!result) return;

      // Fetch with populate if configured
      const entity = populate
        ? (await fetchEntity(result.documentId as string)) || result
        : result;

      const entityName = getEntityName(entity);
      const description = getDescription
        ? getDescription('create', entity)
        : generateDescription('create', entityType, entityName);

      await logAction(strapi, {
        action: 'create',
        entityType,
        entityId: result.documentId as string,
        entityName: entityName || undefined,
        description,
        dataAfter: entity,
        module,
        metadata: getMetadata?.(entity),
      });
    },

    async afterUpdate(event: LifecycleEvent) {
      if (!shouldLog('update')) return;

      const { result, state } = event;
      if (!result) return;

      const original = (state?.original as Record<string, unknown>) || null;

      // Fetch with populate if configured
      const entity = populate
        ? (await fetchEntity(result.documentId as string)) || result
        : result;

      const entityName = getEntityName(entity);
      const description = getDescription
        ? getDescription('update', entity)
        : generateDescription('update', entityType, entityName);

      // Get metadata - prefer update-specific metadata extractor
      const metadata = getUpdateMetadata
        ? getUpdateMetadata(original, entity)
        : getMetadata?.(entity);

      await logAction(strapi, {
        action: 'update',
        entityType,
        entityId: result.documentId as string,
        entityName: entityName || undefined,
        description,
        dataBefore: original || undefined,
        dataAfter: entity,
        module,
        metadata,
      });
    },

    async beforeDelete(event: LifecycleEvent) {
      if (!shouldLog('delete')) return;

      const { where } = event.params;
      if (where?.documentId) {
        const entity = await fetchEntity(where.documentId);
        event.state = { entity };
      }
    },

    async afterDelete(event: LifecycleEvent) {
      if (!shouldLog('delete')) return;

      const { state, params } = event;
      const entity = (state?.entity as Record<string, unknown>) || null;
      const documentId = params.where?.documentId || 'unknown';

      const entityName = entity ? getEntityName(entity) : null;
      const description = getDescription
        ? getDescription('delete', entity || {})
        : generateDescription('delete', entityType, entityName);

      // Get metadata
      const metadata = entity
        ? (getDeleteMetadata || getMetadata)?.(entity)
        : undefined;

      await logAction(strapi, {
        action: 'delete',
        entityType,
        entityId: documentId as string,
        entityName: entityName || undefined,
        description,
        dataBefore: entity || undefined,
        module,
        severity: deleteSeverity,
        metadata,
      });
    },
  };
}

// ==========================================
// PRE-MADE LIFECYCLE CONFIGURATIONS
// ==========================================

/**
 * Simple CRUD logging without custom metadata.
 * For basic entities like ingredient, menu-category, etc.
 */
export function createSimpleLifecycles(
  entityType: string,
  module: Module
) {
  return createEnhancedLifecycles({ entityType, module });
}

/**
 * Storage entity lifecycles (ingredients, suppliers, batches).
 */
export function createStorageLifecycles(
  entityType: string,
  options?: Partial<Omit<EnhancedLifecycleOptions, 'entityType' | 'module'>>
) {
  return createEnhancedLifecycles({
    entityType,
    module: 'storage',
    ...options,
  });
}

/**
 * Admin entity lifecycles (recipes, menu items, categories).
 */
export function createAdminLifecycles(
  entityType: string,
  options?: Partial<Omit<EnhancedLifecycleOptions, 'entityType' | 'module'>>
) {
  return createEnhancedLifecycles({
    entityType,
    module: 'admin',
    ...options,
  });
}

/**
 * Kitchen entity lifecycles.
 */
export function createKitchenLifecycles(
  entityType: string,
  options?: Partial<Omit<EnhancedLifecycleOptions, 'entityType' | 'module'>>
) {
  return createEnhancedLifecycles({
    entityType,
    module: 'kitchen',
    ...options,
  });
}

/**
 * Reservations entity lifecycles.
 */
export function createReservationsLifecycles(
  entityType: string,
  options?: Partial<Omit<EnhancedLifecycleOptions, 'entityType' | 'module'>>
) {
  return createEnhancedLifecycles({
    entityType,
    module: 'reservations',
    ...options,
  });
}

// ==========================================
// COMMON METADATA EXTRACTORS
// ==========================================

/**
 * Extract basic contact info metadata (for suppliers, contacts, etc.)
 */
export function extractContactMetadata(entity: Record<string, unknown>) {
  return {
    name: entity.name,
    contactName: entity.contactName,
    email: entity.email,
    phone: entity.phone,
    isActive: entity.isActive,
  };
}

/**
 * Extract recipe metadata
 */
export function extractRecipeMetadata(entity: Record<string, unknown>) {
  const ingredients = entity.ingredients as unknown[] | undefined;
  const steps = entity.steps as unknown[] | undefined;

  return {
    name: entity.name,
    nameUk: entity.nameUk,
    portionYield: entity.portionYield,
    costPerPortion: entity.costPerPortion,
    prepTimeMinutes: entity.prepTimeMinutes,
    cookTimeMinutes: entity.cookTimeMinutes,
    outputType: entity.outputType,
    isActive: entity.isActive,
    ingredientsCount: ingredients?.length || 0,
    stepsCount: steps?.length || 0,
  };
}

/**
 * Extract menu item metadata
 */
export function extractMenuItemMetadata(entity: Record<string, unknown>) {
  return {
    name: entity.name,
    nameUk: entity.nameUk,
    price: entity.price,
    isAvailable: entity.isAvailable,
    outputType: entity.outputType,
    servingCourse: entity.servingCourse,
    primaryStation: entity.primaryStation,
  };
}

/**
 * Extract reservation metadata
 */
export function extractReservationMetadata(entity: Record<string, unknown>) {
  return {
    contactName: entity.contactName,
    contactPhone: entity.contactPhone,
    dateTime: entity.dateTime,
    partySize: entity.partySize,
    status: entity.status,
    occasion: entity.occasion,
    source: entity.source,
  };
}

/**
 * Extract scheduled order metadata
 */
export function extractScheduledOrderMetadata(entity: Record<string, unknown>) {
  return {
    eventDateTime: entity.eventDateTime,
    prepStartAt: entity.prepStartAt,
    guestCount: entity.guestCount,
    eventType: entity.eventType,
    eventName: entity.eventName,
    contactName: entity.contactName,
    status: entity.status,
    paymentStatus: entity.paymentStatus,
  };
}

/**
 * Extract daily task metadata
 */
export function extractDailyTaskMetadata(entity: Record<string, unknown>) {
  return {
    title: entity.title,
    status: entity.status,
    priority: entity.priority,
    category: entity.category,
    station: entity.station,
    dueDate: entity.dueDate,
    isRecurring: entity.isRecurring,
  };
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  createEnhancedLifecycles,
  createSimpleLifecycles,
  createStorageLifecycles,
  createAdminLifecycles,
  createKitchenLifecycles,
  createReservationsLifecycles,
  extractContactMetadata,
  extractRecipeMetadata,
  extractMenuItemMetadata,
  extractReservationMetadata,
  extractScheduledOrderMetadata,
  extractDailyTaskMetadata,
};
