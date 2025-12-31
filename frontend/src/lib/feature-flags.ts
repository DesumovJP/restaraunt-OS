/**
 * Feature Flags System
 *
 * Gradual rollout with:
 * - Per-module flags
 * - User/role targeting
 * - Percentage rollouts
 * - A/B testing support
 */

// ==========================================
// FLAG DEFINITIONS
// ==========================================

export type FeatureFlagState = 'off' | 'on' | 'percentage' | 'targeted';

export interface FeatureFlag {
  key: string;
  name: string;
  nameUk: string;
  description: string;
  descriptionUk: string;
  module: FlagModule;
  state: FeatureFlagState;
  percentage?: number;                    // For percentage rollout (0-100)
  targetedRoles?: string[];               // Roles with access
  targetedUserIds?: string[];             // Specific users
  targetedTableNumbers?: number[];        // Specific tables (for testing)
  dependencies?: string[];                // Other flags that must be on
  incompatibleWith?: string[];            // Flags that must be off
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  rolloutStartedAt?: string;
  rolloutCompletedAt?: string;
}

export type FlagModule =
  | 'orders'
  | 'kitchen'
  | 'storage'
  | 'billing'
  | 'profiles'
  | 'analytics'
  | 'ui';

// ==========================================
// DEFINED FLAGS
// ==========================================

export const FEATURE_FLAGS: Record<string, Omit<FeatureFlag, 'createdAt' | 'updatedAt' | 'createdBy'>> = {
  // Order/Course flags
  courses_ui: {
    key: 'courses_ui',
    name: 'Course-based UI',
    nameUk: 'Інтерфейс з подачами',
    description: 'Enable 6-course sections in order cards',
    descriptionUk: 'Увімкнути 6 секцій подач в картках замовлень',
    module: 'orders',
    state: 'off',
  },
  course_timers: {
    key: 'course_timers',
    name: 'Course Timers',
    nameUk: 'Таймери подач',
    description: 'Per-course timing and SLA tracking',
    descriptionUk: 'Таймери та SLA для кожної подачі',
    module: 'orders',
    state: 'off',
    dependencies: ['courses_ui'],
  },
  comments_v2: {
    key: 'comments_v2',
    name: 'Comments V2',
    nameUk: 'Коментарі V2',
    description: 'Structured comments with presets and conflict detection',
    descriptionUk: 'Структуровані коментарі з пресетами та виявленням конфліктів',
    module: 'orders',
    state: 'off',
  },
  mass_actions: {
    key: 'mass_actions',
    name: 'Mass Actions',
    nameUk: 'Масові дії',
    description: 'Apply presets to all items, drag-select move',
    descriptionUk: 'Застосування пресетів до всіх страв, переміщення групою',
    module: 'orders',
    state: 'off',
    dependencies: ['courses_ui', 'comments_v2'],
  },

  // Timer flags
  timer_sync: {
    key: 'timer_sync',
    name: 'Timer Sync',
    nameUk: 'Синхронізація таймерів',
    description: 'Server-authoritative timer sync with drift correction',
    descriptionUk: 'Серверна синхронізація таймерів з корекцією дрифту',
    module: 'orders',
    state: 'off',
  },
  table_sla: {
    key: 'table_sla',
    name: 'Table SLA',
    nameUk: 'SLA столу',
    description: 'Per-table and per-course SLA indicators',
    descriptionUk: 'Індикатори SLA для столу та подач',
    module: 'orders',
    state: 'off',
    dependencies: ['timer_sync'],
  },

  // Billing flags
  split_v2: {
    key: 'split_v2',
    name: 'Bill Split V2',
    nameUk: 'Розбиття чеку V2',
    description: 'Advanced bill splitting with fiscal precision',
    descriptionUk: 'Розширене розбиття чеку з фіскальною точністю',
    module: 'billing',
    state: 'off',
  },
  split_receipts: {
    key: 'split_receipts',
    name: 'Split Receipts',
    nameUk: 'Окремі чеки',
    description: 'Generate separate receipts per participant',
    descriptionUk: 'Генерація окремих чеків для кожного учасника',
    module: 'billing',
    state: 'off',
    dependencies: ['split_v2'],
  },

  // Storage flags
  smartstorage_yield: {
    key: 'smartstorage_yield',
    name: 'SmartStorage Yield',
    nameUk: 'SmartStorage Вихід',
    description: 'Yield profiles and batch processing',
    descriptionUk: 'Профілі виходу та обробка партій',
    module: 'storage',
    state: 'off',
  },
  yield_calibration: {
    key: 'yield_calibration',
    name: 'Yield Calibration',
    nameUk: 'Калібрування виходу',
    description: 'Manager-approved yield profile adjustments',
    descriptionUk: 'Коригування профілів виходу зі схваленням менеджера',
    module: 'storage',
    state: 'off',
    dependencies: ['smartstorage_yield'],
  },
  bom_integration: {
    key: 'bom_integration',
    name: 'BOM Integration',
    nameUk: 'Інтеграція BOM',
    description: 'Recipe-based inventory consumption with FIFO',
    descriptionUk: 'Споживання запасів на основі рецептів з FIFO',
    module: 'storage',
    state: 'off',
    dependencies: ['smartstorage_yield'],
  },
  barcode_weighing: {
    key: 'barcode_weighing',
    name: 'Barcode Weighing',
    nameUk: 'Зважування по штрихкоду',
    description: 'Mandatory weighing with barcode scan',
    descriptionUk: "Обов'язкове зважування при скануванні штрихкоду",
    module: 'storage',
    state: 'off',
  },

  // Kitchen flags
  kds_subtasks: {
    key: 'kds_subtasks',
    name: 'KDS Subtasks',
    nameUk: 'KDS Підзадачі',
    description: 'Split order items into station subtasks',
    descriptionUk: 'Розбиття страв на підзадачі по станціях',
    module: 'kitchen',
    state: 'off',
  },
  station_routing: {
    key: 'station_routing',
    name: 'Station Routing',
    nameUk: 'Маршрутизація станцій',
    description: 'Auto-route items to stations based on menu mapping',
    descriptionUk: 'Автоматична маршрутизація страв на станції',
    module: 'kitchen',
    state: 'off',
    dependencies: ['kds_subtasks'],
  },
  station_capacity: {
    key: 'station_capacity',
    name: 'Station Capacity',
    nameUk: 'Ємність станцій',
    description: 'Station load meters and overload warnings',
    descriptionUk: 'Лічильники навантаження станцій та попередження про перевантаження',
    module: 'kitchen',
    state: 'off',
    dependencies: ['kds_subtasks'],
  },

  // Audit flags
  undo_audit_strict: {
    key: 'undo_audit_strict',
    name: 'Strict Undo Audit',
    nameUk: 'Строгий аудит відміни',
    description: 'Require reason codes for all undo operations',
    descriptionUk: 'Вимагати коди причин для всіх операцій відміни',
    module: 'orders',
    state: 'off',
  },
  event_log_v2: {
    key: 'event_log_v2',
    name: 'Event Log V2',
    nameUk: 'Журнал подій V2',
    description: 'Unified event log with correlation IDs',
    descriptionUk: 'Єдиний журнал подій з кореляційними ID',
    module: 'analytics',
    state: 'off',
  },

  // UI flags
  dark_mode: {
    key: 'dark_mode',
    name: 'Dark Mode',
    nameUk: 'Темна тема',
    description: 'Dark theme for kitchen displays',
    descriptionUk: 'Темна тема для кухонних дисплеїв',
    module: 'ui',
    state: 'off',
  },
  kds_touch_gestures: {
    key: 'kds_touch_gestures',
    name: 'KDS Touch Gestures',
    nameUk: 'KDS Жести',
    description: 'Swipe gestures for status changes on KDS',
    descriptionUk: 'Жести свайпу для зміни статусу на KDS',
    module: 'ui',
    state: 'off',
  },
};

// ==========================================
// FLAG EVALUATION
// ==========================================

export interface FlagEvaluationContext {
  userId?: string;
  userRole?: string;
  tableNumber?: number;
  sessionId?: string;
}

export interface FlagEvaluationResult {
  enabled: boolean;
  reason: string;
  variant?: string;
}

export function evaluateFlag(
  flag: FeatureFlag,
  context: FlagEvaluationContext
): FlagEvaluationResult {
  // Check state
  if (flag.state === 'off') {
    return { enabled: false, reason: 'flag_disabled' };
  }

  if (flag.state === 'on') {
    return { enabled: true, reason: 'flag_enabled' };
  }

  // Check targeted users
  if (flag.state === 'targeted') {
    if (context.userId && flag.targetedUserIds?.includes(context.userId)) {
      return { enabled: true, reason: 'user_targeted' };
    }

    if (context.userRole && flag.targetedRoles?.includes(context.userRole)) {
      return { enabled: true, reason: 'role_targeted' };
    }

    if (context.tableNumber && flag.targetedTableNumbers?.includes(context.tableNumber)) {
      return { enabled: true, reason: 'table_targeted' };
    }

    return { enabled: false, reason: 'not_targeted' };
  }

  // Check percentage rollout
  if (flag.state === 'percentage' && flag.percentage !== undefined) {
    // Use consistent hashing based on user/session ID
    const hashInput = context.userId || context.sessionId || 'anonymous';
    const hash = simpleHash(hashInput + flag.key);
    const bucket = hash % 100;

    if (bucket < flag.percentage) {
      return { enabled: true, reason: 'percentage_rollout', variant: `bucket_${bucket}` };
    }

    return { enabled: false, reason: 'percentage_excluded', variant: `bucket_${bucket}` };
  }

  return { enabled: false, reason: 'unknown_state' };
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ==========================================
// DEPENDENCY CHECKING
// ==========================================

export function checkDependencies(
  flagKey: string,
  allFlags: Record<string, FeatureFlag>,
  context: FlagEvaluationContext
): { satisfied: boolean; missing: string[] } {
  const flag = allFlags[flagKey];
  if (!flag || !flag.dependencies) {
    return { satisfied: true, missing: [] };
  }

  const missing: string[] = [];

  for (const depKey of flag.dependencies) {
    const depFlag = allFlags[depKey];
    if (!depFlag) {
      missing.push(depKey);
      continue;
    }

    const result = evaluateFlag(depFlag, context);
    if (!result.enabled) {
      missing.push(depKey);
    }
  }

  return {
    satisfied: missing.length === 0,
    missing,
  };
}

export function checkIncompatibilities(
  flagKey: string,
  allFlags: Record<string, FeatureFlag>,
  context: FlagEvaluationContext
): { compatible: boolean; conflicts: string[] } {
  const flag = allFlags[flagKey];
  if (!flag || !flag.incompatibleWith) {
    return { compatible: true, conflicts: [] };
  }

  const conflicts: string[] = [];

  for (const incompatKey of flag.incompatibleWith) {
    const incompatFlag = allFlags[incompatKey];
    if (!incompatFlag) continue;

    const result = evaluateFlag(incompatFlag, context);
    if (result.enabled) {
      conflicts.push(incompatKey);
    }
  }

  return {
    compatible: conflicts.length === 0,
    conflicts,
  };
}

// ==========================================
// ROLLOUT MANAGEMENT
// ==========================================

export interface RolloutPlan {
  flagKey: string;
  stages: RolloutStage[];
  currentStage: number;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'rolled_back';
}

export interface RolloutStage {
  name: string;
  type: 'canary' | 'pilot' | 'percentage' | 'full';
  config: {
    percentage?: number;
    roles?: string[];
    userIds?: string[];
    tableNumbers?: number[];
  };
  duration: number;           // Hours
  successCriteria: SuccessCriterion[];
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'active' | 'passed' | 'failed';
}

export interface SuccessCriterion {
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  description: string;
}

export const DEFAULT_ROLLOUT_PLAN: Omit<RolloutPlan, 'flagKey'> = {
  stages: [
    {
      name: 'Canary',
      type: 'canary',
      config: {
        roles: ['admin'],
        percentage: 0,
      },
      duration: 24,
      successCriteria: [
        { metric: 'error_rate', condition: 'lt', threshold: 0.01, description: 'Error rate < 1%' },
      ],
      status: 'pending',
    },
    {
      name: 'Pilot',
      type: 'pilot',
      config: {
        roles: ['admin', 'manager'],
        tableNumbers: [1, 2, 3],
      },
      duration: 48,
      successCriteria: [
        { metric: 'error_rate', condition: 'lt', threshold: 0.01, description: 'Error rate < 1%' },
        { metric: 'user_satisfaction', condition: 'gte', threshold: 4.0, description: 'Satisfaction >= 4.0' },
      ],
      status: 'pending',
    },
    {
      name: 'Gradual Rollout',
      type: 'percentage',
      config: {
        percentage: 25,
      },
      duration: 72,
      successCriteria: [
        { metric: 'error_rate', condition: 'lt', threshold: 0.01, description: 'Error rate < 1%' },
      ],
      status: 'pending',
    },
    {
      name: 'Full Rollout',
      type: 'full',
      config: {
        percentage: 100,
      },
      duration: 0,
      successCriteria: [],
      status: 'pending',
    },
  ],
  currentStage: 0,
  status: 'pending',
};

// ==========================================
// ROLLBACK
// ==========================================

export interface RollbackPlan {
  flagKey: string;
  reason: string;
  triggeredBy: string;
  triggeredAt: string;
  previousState: FeatureFlagState;
  previousConfig: Partial<FeatureFlag>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completedAt?: string;
  error?: string;
}

export function createRollbackPlan(
  flag: FeatureFlag,
  reason: string,
  triggeredBy: string
): RollbackPlan {
  return {
    flagKey: flag.key,
    reason,
    triggeredBy,
    triggeredAt: new Date().toISOString(),
    previousState: flag.state,
    previousConfig: {
      percentage: flag.percentage,
      targetedRoles: flag.targetedRoles,
      targetedUserIds: flag.targetedUserIds,
      targetedTableNumbers: flag.targetedTableNumbers,
    },
    status: 'pending',
  };
}

// ==========================================
// CLIENT HOOK
// ==========================================

export interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  error?: string;
  reason?: string;
}

// React hook example (would be implemented with actual state management)
/*
export function useFeatureFlag(
  flagKey: string,
  context?: Partial<FlagEvaluationContext>
): UseFeatureFlagResult {
  const [result, setResult] = useState<UseFeatureFlagResult>({
    enabled: false,
    loading: true,
  });

  useEffect(() => {
    // Fetch flag from server or local cache
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
      setResult({ enabled: false, loading: false, error: 'Flag not found' });
      return;
    }

    const fullContext: FlagEvaluationContext = {
      userId: getCurrentUserId(),
      userRole: getCurrentUserRole(),
      ...context,
    };

    // Check dependencies
    const deps = checkDependencies(flagKey, FEATURE_FLAGS as any, fullContext);
    if (!deps.satisfied) {
      setResult({
        enabled: false,
        loading: false,
        reason: `Missing dependencies: ${deps.missing.join(', ')}`,
      });
      return;
    }

    const evalResult = evaluateFlag(flag as FeatureFlag, fullContext);
    setResult({
      enabled: evalResult.enabled,
      loading: false,
      reason: evalResult.reason,
    });
  }, [flagKey, context]);

  return result;
}
*/
