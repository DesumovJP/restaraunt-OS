/**
 * Observability System
 *
 * Metrics, dashboards, alerts, and distributed tracing
 * for comprehensive system monitoring.
 */

// ==========================================
// METRIC DEFINITIONS
// ==========================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  unit: string;
  labels: string[];
  buckets?: number[];          // For histograms
  quantiles?: number[];        // For summaries
  alertThresholds?: AlertThreshold[];
}

export interface AlertThreshold {
  level: 'warning' | 'critical';
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration?: number;           // Seconds condition must persist
  message: string;
}

// ==========================================
// CORE METRICS
// ==========================================

export const METRICS: Record<string, MetricDefinition> = {
  // Order metrics
  orders_total: {
    name: 'restaurant_orders_total',
    type: 'counter',
    description: 'Total number of orders',
    unit: 'orders',
    labels: ['status', 'table_number', 'waiter_id'],
  },
  order_items_total: {
    name: 'restaurant_order_items_total',
    type: 'counter',
    description: 'Total number of order items',
    unit: 'items',
    labels: ['status', 'course_type', 'station'],
  },
  order_value: {
    name: 'restaurant_order_value',
    type: 'histogram',
    description: 'Order value distribution',
    unit: 'UAH',
    labels: ['table_number'],
    buckets: [100, 200, 500, 1000, 2000, 5000],
  },

  // Timing metrics
  prep_time_seconds: {
    name: 'restaurant_prep_time_seconds',
    type: 'histogram',
    description: 'Item preparation time',
    unit: 'seconds',
    labels: ['menu_item', 'station', 'course_type'],
    buckets: [60, 120, 180, 300, 600, 900, 1200],
    alertThresholds: [
      { level: 'warning', condition: 'gt', value: 600, message: 'Prep time exceeds 10 minutes' },
      { level: 'critical', condition: 'gt', value: 900, message: 'Prep time exceeds 15 minutes' },
    ],
  },
  table_time_seconds: {
    name: 'restaurant_table_time_seconds',
    type: 'histogram',
    description: 'Total table session time',
    unit: 'seconds',
    labels: ['table_number', 'guest_count'],
    buckets: [1800, 3600, 5400, 7200, 9000],
  },
  course_time_seconds: {
    name: 'restaurant_course_time_seconds',
    type: 'histogram',
    description: 'Time per course',
    unit: 'seconds',
    labels: ['course_type'],
    buckets: [300, 600, 900, 1200, 1800],
  },

  // SLA metrics
  sla_breaches_total: {
    name: 'restaurant_sla_breaches_total',
    type: 'counter',
    description: 'Number of SLA breaches',
    unit: 'breaches',
    labels: ['type', 'station', 'severity'],
    alertThresholds: [
      { level: 'warning', condition: 'gt', value: 5, duration: 3600, message: 'High SLA breach rate' },
      { level: 'critical', condition: 'gt', value: 10, duration: 3600, message: 'Critical SLA breach rate' },
    ],
  },
  sla_compliance_percent: {
    name: 'restaurant_sla_compliance_percent',
    type: 'gauge',
    description: 'SLA compliance percentage',
    unit: 'percent',
    labels: ['station', 'period'],
    alertThresholds: [
      { level: 'warning', condition: 'lt', value: 90, message: 'SLA compliance below 90%' },
      { level: 'critical', condition: 'lt', value: 80, message: 'SLA compliance below 80%' },
    ],
  },

  // Station metrics
  station_load_percent: {
    name: 'restaurant_station_load_percent',
    type: 'gauge',
    description: 'Station load percentage',
    unit: 'percent',
    labels: ['station'],
    alertThresholds: [
      { level: 'warning', condition: 'gt', value: 80, message: 'Station load above 80%' },
      { level: 'critical', condition: 'gt', value: 95, message: 'Station overloaded' },
    ],
  },
  station_queue_size: {
    name: 'restaurant_station_queue_size',
    type: 'gauge',
    description: 'Number of items in station queue',
    unit: 'items',
    labels: ['station'],
  },

  // Yield metrics
  yield_variance_percent: {
    name: 'restaurant_yield_variance_percent',
    type: 'histogram',
    description: 'Yield variance from expected',
    unit: 'percent',
    labels: ['product', 'process_type'],
    buckets: [-20, -10, -5, 0, 5, 10, 20],
    alertThresholds: [
      { level: 'warning', condition: 'lt', value: -10, message: 'Yield variance exceeds -10%' },
      { level: 'critical', condition: 'lt', value: -20, message: 'Critical yield variance' },
    ],
  },
  waste_rate_percent: {
    name: 'restaurant_waste_rate_percent',
    type: 'gauge',
    description: 'Waste rate as percentage of input',
    unit: 'percent',
    labels: ['product', 'reason'],
    alertThresholds: [
      { level: 'warning', condition: 'gt', value: 10, message: 'Waste rate above 10%' },
      { level: 'critical', condition: 'gt', value: 20, message: 'Critical waste rate' },
    ],
  },

  // Inventory metrics
  stock_level: {
    name: 'restaurant_stock_level',
    type: 'gauge',
    description: 'Current stock level',
    unit: 'units',
    labels: ['product', 'unit'],
  },
  stock_days_remaining: {
    name: 'restaurant_stock_days_remaining',
    type: 'gauge',
    description: 'Estimated days until stock depletion',
    unit: 'days',
    labels: ['product'],
    alertThresholds: [
      { level: 'warning', condition: 'lt', value: 3, message: 'Low stock - less than 3 days' },
      { level: 'critical', condition: 'lt', value: 1, message: 'Critical stock level' },
    ],
  },
  expiring_batches: {
    name: 'restaurant_expiring_batches',
    type: 'gauge',
    description: 'Number of batches expiring soon',
    unit: 'batches',
    labels: ['days_until_expiry'],
    alertThresholds: [
      { level: 'warning', condition: 'gt', value: 5, message: 'Multiple batches expiring soon' },
    ],
  },

  // Comment/conflict metrics
  comment_conflicts_total: {
    name: 'restaurant_comment_conflicts_total',
    type: 'counter',
    description: 'Allergy/dietary comment conflicts detected',
    unit: 'conflicts',
    labels: ['conflict_type', 'severity'],
  },
  comments_per_order: {
    name: 'restaurant_comments_per_order',
    type: 'histogram',
    description: 'Number of comments per order',
    unit: 'comments',
    labels: [],
    buckets: [0, 1, 2, 3, 5, 10],
  },

  // Undo metrics
  undo_operations_total: {
    name: 'restaurant_undo_operations_total',
    type: 'counter',
    description: 'Number of undo operations',
    unit: 'operations',
    labels: ['reason_code', 'item_status', 'actor_role'],
    alertThresholds: [
      { level: 'warning', condition: 'gt', value: 10, duration: 3600, message: 'High undo rate' },
    ],
  },

  // Bill split metrics
  split_bills_total: {
    name: 'restaurant_split_bills_total',
    type: 'counter',
    description: 'Number of split bills',
    unit: 'bills',
    labels: ['mode', 'participant_count'],
  },
  split_rounding_pool: {
    name: 'restaurant_split_rounding_pool',
    type: 'histogram',
    description: 'Rounding pool amounts in bill splits',
    unit: 'UAH',
    labels: [],
    buckets: [0.01, 0.05, 0.10, 0.50, 1.00],
  },
};

// ==========================================
// METRIC COLLECTOR
// ==========================================

export interface MetricValue {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export interface MetricCollector {
  increment(name: string, labels?: Record<string, string>, value?: number): void;
  decrement(name: string, labels?: Record<string, string>, value?: number): void;
  set(name: string, value: number, labels?: Record<string, string>): void;
  observe(name: string, value: number, labels?: Record<string, string>): void;
  getAll(): MetricValue[];
  reset(): void;
}

// In-memory metric store for client-side
class InMemoryMetricCollector implements MetricCollector {
  private metrics: Map<string, MetricValue[]> = new Map();

  private getKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  increment(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.getKey(name, labels);
    const existing = this.metrics.get(key) || [];
    const current = existing.length > 0 ? existing[existing.length - 1].value : 0;

    this.metrics.set(key, [
      ...existing,
      {
        name,
        value: current + value,
        labels,
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  decrement(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    this.increment(name, labels, -value);
  }

  set(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels);

    this.metrics.set(key, [
      {
        name,
        value,
        labels,
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels);
    const existing = this.metrics.get(key) || [];

    this.metrics.set(key, [
      ...existing,
      {
        name,
        value,
        labels,
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  getAll(): MetricValue[] {
    const result: MetricValue[] = [];
    for (const values of this.metrics.values()) {
      if (values.length > 0) {
        result.push(values[values.length - 1]);
      }
    }
    return result;
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const metrics = new InMemoryMetricCollector();

// ==========================================
// DISTRIBUTED TRACING
// ==========================================

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'ok' | 'error' | 'cancelled';
  tags: Record<string, string | number | boolean>;
  logs: SpanLog[];
  baggage: Record<string, string>;
}

export interface SpanLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  fields?: Record<string, unknown>;
}

export function createTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

export function createSpanId(): string {
  return `span_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

export function startSpan(
  traceId: string,
  operationName: string,
  parentSpanId?: string,
  tags: Record<string, string | number | boolean> = {}
): TraceSpan {
  return {
    traceId,
    spanId: createSpanId(),
    parentSpanId,
    operationName,
    serviceName: 'restaurant-os',
    startTime: new Date().toISOString(),
    status: 'ok',
    tags,
    logs: [],
    baggage: {},
  };
}

export function finishSpan(span: TraceSpan, status: 'ok' | 'error' = 'ok'): TraceSpan {
  const endTime = new Date();
  const startTime = new Date(span.startTime);

  return {
    ...span,
    endTime: endTime.toISOString(),
    duration: endTime.getTime() - startTime.getTime(),
    status,
  };
}

// ==========================================
// ORDER FLOW TRACING
// ==========================================

export interface OrderFlowTrace {
  traceId: string;
  orderDocumentId: string;
  tableNumber: number;

  spans: {
    orderCreated: TraceSpan;
    orderSubmitted?: TraceSpan;
    kitchenReceived?: TraceSpan;
    itemSpans: Map<string, TraceSpan[]>; // itemId -> spans
    courseSpans: Map<string, TraceSpan>; // courseType -> span
    served?: TraceSpan;
    billed?: TraceSpan;
  };

  totalDuration?: number;
  slaBreaches: string[];
}

export function startOrderFlowTrace(
  orderDocumentId: string,
  tableNumber: number
): OrderFlowTrace {
  const traceId = createTraceId();

  return {
    traceId,
    orderDocumentId,
    tableNumber,
    spans: {
      orderCreated: startSpan(traceId, 'order.create', undefined, {
        'order.id': orderDocumentId,
        'table.number': tableNumber,
      }),
      itemSpans: new Map(),
      courseSpans: new Map(),
    },
    slaBreaches: [],
  };
}

// ==========================================
// ALERTS
// ==========================================

export interface Alert {
  id: string;
  timestamp: string;
  level: 'warning' | 'critical';
  source: string;
  metric?: string;
  condition?: string;
  value?: number;
  threshold?: number;
  message: string;
  messageUk: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  tags: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number;         // Seconds
  level: 'warning' | 'critical';
  message: string;
  messageUk: string;
  channels: ('ui' | 'email' | 'sms' | 'webhook')[];
  cooldown: number;         // Seconds between alerts
  lastFired?: string;
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'sla_breach_high',
    name: 'High SLA Breach Rate',
    enabled: true,
    metric: 'restaurant_sla_breaches_total',
    condition: 'gt',
    threshold: 5,
    duration: 3600,
    level: 'warning',
    message: 'SLA breach rate is high: {value} breaches in the last hour',
    messageUk: 'Високий рівень порушень SLA: {value} порушень за останню годину',
    channels: ['ui'],
    cooldown: 1800,
  },
  {
    id: 'station_overload',
    name: 'Station Overload',
    enabled: true,
    metric: 'restaurant_station_load_percent',
    condition: 'gt',
    threshold: 95,
    duration: 300,
    level: 'critical',
    message: 'Station {station} is overloaded at {value}%',
    messageUk: 'Станція {station} перевантажена на {value}%',
    channels: ['ui', 'email'],
    cooldown: 600,
  },
  {
    id: 'low_stock',
    name: 'Low Stock Alert',
    enabled: true,
    metric: 'restaurant_stock_days_remaining',
    condition: 'lt',
    threshold: 2,
    duration: 0,
    level: 'warning',
    message: 'Low stock for {product}: {value} days remaining',
    messageUk: 'Низький запас {product}: залишилось {value} днів',
    channels: ['ui'],
    cooldown: 86400,
  },
  {
    id: 'yield_variance_critical',
    name: 'Critical Yield Variance',
    enabled: true,
    metric: 'restaurant_yield_variance_percent',
    condition: 'lt',
    threshold: -15,
    duration: 0,
    level: 'critical',
    message: 'Critical yield variance for {product}: {value}%',
    messageUk: 'Критичне відхилення виходу для {product}: {value}%',
    channels: ['ui', 'email'],
    cooldown: 3600,
  },
];

// ==========================================
// DASHBOARDS
// ==========================================

export interface DashboardWidget {
  id: string;
  type: 'counter' | 'gauge' | 'chart' | 'table' | 'heatmap' | 'alert_list';
  title: string;
  titleUk: string;
  metric?: string;
  query?: string;
  size: 'small' | 'medium' | 'large';
  position: { row: number; col: number };
  refreshInterval: number;      // Seconds
  config: Record<string, unknown>;
}

export interface Dashboard {
  id: string;
  name: string;
  nameUk: string;
  description: string;
  widgets: DashboardWidget[];
  refreshInterval: number;
  isDefault: boolean;
  roles: string[];              // Who can see this dashboard
}

export const DEFAULT_DASHBOARDS: Dashboard[] = [
  {
    id: 'kitchen_ops',
    name: 'Kitchen Operations',
    nameUk: 'Операції кухні',
    description: 'Real-time kitchen performance monitoring',
    refreshInterval: 10,
    isDefault: true,
    roles: ['admin', 'manager', 'chef'],
    widgets: [
      {
        id: 'active_orders',
        type: 'counter',
        title: 'Active Orders',
        titleUk: 'Активні замовлення',
        metric: 'restaurant_orders_total',
        size: 'small',
        position: { row: 0, col: 0 },
        refreshInterval: 5,
        config: { filter: { status: 'in_progress' } },
      },
      {
        id: 'station_load',
        type: 'gauge',
        title: 'Station Load',
        titleUk: 'Завантаження станцій',
        metric: 'restaurant_station_load_percent',
        size: 'medium',
        position: { row: 0, col: 1 },
        refreshInterval: 5,
        config: { showAllStations: true },
      },
      {
        id: 'prep_time_chart',
        type: 'chart',
        title: 'Prep Time Trend',
        titleUk: 'Тренд часу приготування',
        metric: 'restaurant_prep_time_seconds',
        size: 'large',
        position: { row: 1, col: 0 },
        refreshInterval: 60,
        config: { chartType: 'line', period: '1h' },
      },
      {
        id: 'sla_breaches',
        type: 'alert_list',
        title: 'SLA Breaches',
        titleUk: 'Порушення SLA',
        size: 'medium',
        position: { row: 1, col: 2 },
        refreshInterval: 10,
        config: { maxItems: 10, severity: ['warning', 'critical'] },
      },
    ],
  },
  {
    id: 'inventory_ops',
    name: 'Inventory Operations',
    nameUk: 'Операції складу',
    description: 'Stock levels and yield tracking',
    refreshInterval: 60,
    isDefault: false,
    roles: ['admin', 'manager', 'chef'],
    widgets: [
      {
        id: 'low_stock_items',
        type: 'table',
        title: 'Low Stock Items',
        titleUk: 'Товари з низьким запасом',
        metric: 'restaurant_stock_level',
        size: 'large',
        position: { row: 0, col: 0 },
        refreshInterval: 300,
        config: { filter: { belowMin: true }, columns: ['product', 'current', 'min', 'days'] },
      },
      {
        id: 'yield_variance',
        type: 'heatmap',
        title: 'Yield Variance by Product',
        titleUk: 'Відхилення виходу по продуктах',
        metric: 'restaurant_yield_variance_percent',
        size: 'large',
        position: { row: 1, col: 0 },
        refreshInterval: 300,
        config: { colorScale: 'diverging', center: 0 },
      },
      {
        id: 'waste_rate',
        type: 'chart',
        title: 'Waste Rate Trend',
        titleUk: 'Тренд втрат',
        metric: 'restaurant_waste_rate_percent',
        size: 'medium',
        position: { row: 2, col: 0 },
        refreshInterval: 300,
        config: { chartType: 'area', period: '7d' },
      },
    ],
  },
];

// ==========================================
// RETRY POLICIES
// ==========================================

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_POLICIES: Record<string, RetryPolicy> = {
  api_call: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'],
  },
  websocket_reconnect: {
    maxRetries: 10,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 1.5,
    retryableErrors: ['CONNECTION_LOST', 'HANDSHAKE_FAILED'],
  },
  database_write: {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    retryableErrors: ['DEADLOCK', 'TIMEOUT', 'CONNECTION_LOST'],
  },
};

export function calculateRetryDelay(
  attempt: number,
  policy: RetryPolicy
): number {
  const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt);
  return Math.min(delay, policy.maxDelayMs);
}
