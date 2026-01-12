/**
 * Database Migrations
 *
 * Complete migration set for Restaurant OS enhancements.
 * All migrations include:
 * - up() function for applying
 * - down() function for rollback
 * - Indexes for query performance
 * - Data backfills where needed
 */

// ==========================================
// MIGRATION TYPES
// ==========================================

export interface Migration {
  version: string;
  name: string;
  description: string;
  up: (db: DatabaseConnection) => Promise<void>;
  down: (db: DatabaseConnection) => Promise<void>;
  backfill?: (db: DatabaseConnection) => Promise<void>;
  createdAt: string;
}

export interface DatabaseConnection {
  schema: SchemaBuilder;
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  execute: (sql: string, params?: unknown[]) => Promise<void>;
  transaction: <T>(fn: (trx: DatabaseConnection) => Promise<T>) => Promise<T>;
}

export interface SchemaBuilder {
  createTable: (name: string, builder: (table: TableBuilder) => void) => Promise<void>;
  alterTable: (name: string, builder: (table: TableBuilder) => void) => Promise<void>;
  dropTable: (name: string) => Promise<void>;
  hasTable: (name: string) => Promise<boolean>;
  hasColumn: (table: string, column: string) => Promise<boolean>;
}

export interface TableBuilder {
  string: (name: string, length?: number) => ColumnBuilder;
  text: (name: string) => ColumnBuilder;
  integer: (name: string) => ColumnBuilder;
  bigInteger: (name: string) => ColumnBuilder;
  decimal: (name: string, precision: number, scale: number) => ColumnBuilder;
  boolean: (name: string) => ColumnBuilder;
  date: (name: string) => ColumnBuilder;
  timestamp: (name: string) => ColumnBuilder;
  timestamps: (useTimestamps?: boolean, defaultToNow?: boolean) => void;
  jsonb: (name: string) => ColumnBuilder;
  index: (columns: string | string[], name?: string) => void;
  unique: (columns: string | string[], name?: string) => void;
  dropColumn: (name: string) => void;
  dropIndex: (name: string) => void;
}

export interface ColumnBuilder {
  primary: () => ColumnBuilder;
  notNullable: () => ColumnBuilder;
  nullable: () => ColumnBuilder;
  defaultTo: (value: unknown) => ColumnBuilder;
  references: (column: string) => ColumnBuilder;
  inTable: (table: string) => ColumnBuilder;
  onDelete: (action: string) => ColumnBuilder;
  unique: () => ColumnBuilder;
}

// ==========================================
// MIGRATION 001: Course Fields
// ==========================================

export const migration001_course_fields: Migration = {
  version: '001',
  name: 'add_course_fields',
  description: 'Add course type, index, and timing fields to order items',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    // Add fields to order_items
    await db.schema.alterTable('order_items', (table) => {
      table.string('document_id', 50).notNullable().unique();
      table.string('slug', 100).notNullable().unique();
      table.string('course_type', 20).defaultTo('main');
      table.integer('course_index').defaultTo(0);
      table.timestamp('prep_start_at').nullable();
      table.bigInteger('prep_elapsed_ms').defaultTo(0);
      table.timestamp('served_at').nullable();
      table.string('undo_ref', 50).nullable();

      // Indexes for filtering
      table.index(['course_type'], 'idx_order_items_course_type');
      table.index(['status', 'course_type'], 'idx_order_items_status_course');
    });

    // Add fields to orders
    await db.schema.alterTable('orders', (table) => {
      table.string('document_id', 50).notNullable().unique();
      table.string('slug', 100).notNullable().unique();
      table.string('table_session_id', 50).nullable();
      table.timestamp('table_start_at').nullable();
      table.bigInteger('table_elapsed_ms').defaultTo(0);
      table.jsonb('split_config').nullable();
      table.jsonb('undo_history').defaultTo('[]');

      table.index(['table_session_id'], 'idx_orders_session');
      table.index(['table_number', 'status'], 'idx_orders_table_status');
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.alterTable('order_items', (table) => {
      table.dropIndex('idx_order_items_course_type');
      table.dropIndex('idx_order_items_status_course');
      table.dropColumn('document_id');
      table.dropColumn('slug');
      table.dropColumn('course_type');
      table.dropColumn('course_index');
      table.dropColumn('prep_start_at');
      table.dropColumn('prep_elapsed_ms');
      table.dropColumn('served_at');
      table.dropColumn('undo_ref');
    });

    await db.schema.alterTable('orders', (table) => {
      table.dropIndex('idx_orders_session');
      table.dropIndex('idx_orders_table_status');
      table.dropColumn('document_id');
      table.dropColumn('slug');
      table.dropColumn('table_session_id');
      table.dropColumn('table_start_at');
      table.dropColumn('table_elapsed_ms');
      table.dropColumn('split_config');
      table.dropColumn('undo_history');
    });
  },

  async backfill(db: DatabaseConnection) {
    // Generate document_id and slug for existing records
    await db.execute(`
      UPDATE order_items
      SET
        document_id = CONCAT('item_', id, '_', FLOOR(RANDOM() * 1000000)),
        slug = CONCAT('item-', id, '-', EXTRACT(EPOCH FROM created_at)::INTEGER),
        course_type = 'main',
        course_index = 0
      WHERE document_id IS NULL
    `);

    await db.execute(`
      UPDATE orders
      SET
        document_id = CONCAT('order_', id, '_', FLOOR(RANDOM() * 1000000)),
        slug = CONCAT('order-', id, '-', EXTRACT(EPOCH FROM created_at)::INTEGER)
      WHERE document_id IS NULL
    `);
  },
};

// ==========================================
// MIGRATION 002: Comments
// ==========================================

export const migration002_comments: Migration = {
  version: '002',
  name: 'add_comments',
  description: 'Add structured comments with presets and history',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    await db.schema.alterTable('order_items', (table) => {
      table.jsonb('comment').nullable();
      table.jsonb('comment_history').defaultTo('[]');
    });

    // Create comment presets table
    await db.schema.createTable('comment_presets', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable().unique();
      table.string('key', 50).notNullable().unique();
      table.string('category', 20).notNullable();
      table.jsonb('label').notNullable();
      table.string('icon', 50).nullable();
      table.string('severity', 20).defaultTo('normal');
      table.boolean('is_active').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);

      table.index(['category', 'is_active'], 'idx_presets_category');
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.dropTable('comment_presets');

    await db.schema.alterTable('order_items', (table) => {
      table.dropColumn('comment');
      table.dropColumn('comment_history');
    });
  },
};

// ==========================================
// MIGRATION 003: Table Sessions
// ==========================================

export const migration003_table_sessions: Migration = {
  version: '003',
  name: 'add_table_sessions',
  description: 'Add table session tracking with course timings',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    await db.schema.createTable('table_sessions', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable().unique();
      table.integer('table_number').notNullable();
      table.timestamp('started_at').notNullable();
      table.timestamp('ended_at').nullable();
      table.string('status', 20).defaultTo('active');
      table.integer('guest_count').notNullable();
      table.string('waiter_id', 50).notNullable();
      table.jsonb('orders').defaultTo('[]');
      table.bigInteger('elapsed_ms').defaultTo(0);
      table.jsonb('course_timings').defaultTo('[]');
      table.timestamps(true, true);

      table.index(['table_number', 'status'], 'idx_sessions_table_status');
      table.index(['waiter_id', 'status'], 'idx_sessions_waiter');
      table.index(['started_at'], 'idx_sessions_started');
    });

    // SLA configuration table
    await db.schema.createTable('sla_configs', (table) => {
      table.string('document_id', 50).primary();
      table.string('course_type', 20).nullable();
      table.string('station', 20).nullable();
      table.bigInteger('target_ms').notNullable();
      table.bigInteger('warning_ms').notNullable();
      table.bigInteger('critical_ms').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);

      table.unique(['course_type', 'station'], 'uq_sla_course_station');
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.dropTable('sla_configs');
    await db.schema.dropTable('table_sessions');
  },
};

// ==========================================
// MIGRATION 004: Bill Splits
// ==========================================

export const migration004_bill_splits: Migration = {
  version: '004',
  name: 'add_bill_splits',
  description: 'Add bill splitting with participants and rounding',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    await db.schema.createTable('bill_splits', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable().unique();
      table.string('order_id', 50).notNullable().references('document_id').inTable('orders');
      table.string('mode', 20).notNullable();
      table.jsonb('participants').notNullable();
      table.jsonb('totals').notNullable();
      table.jsonb('rounding_config').nullable();
      table.decimal('rounding_pool', 10, 2).defaultTo(0);
      table.string('status', 20).defaultTo('draft');
      table.string('created_by', 50).notNullable();
      table.timestamps(true, true);

      table.index(['order_id'], 'idx_splits_order');
      table.index(['status'], 'idx_splits_status');
    });

    // Split payments tracking
    await db.schema.createTable('split_payments', (table) => {
      table.string('document_id', 50).primary();
      table.string('split_id', 50).notNullable().references('document_id').inTable('bill_splits');
      table.string('person_id', 50).notNullable();
      table.decimal('amount', 10, 2).notNullable();
      table.string('payment_method', 20).notNullable();
      table.string('receipt_number', 50).nullable();
      table.string('status', 20).defaultTo('pending');
      table.timestamp('paid_at').nullable();
      table.timestamps(true, true);

      table.index(['split_id', 'person_id'], 'idx_payments_split_person');
    });

    // Rounding configuration
    await db.schema.createTable('rounding_configs', (table) => {
      table.string('document_id', 50).primary();
      table.string('name', 100).notNullable();
      table.string('rounding_method', 20).notNullable(); // banker, half_up, floor, ceil
      table.string('tax_distribution', 20).notNullable(); // per_person, global_then_split
      table.string('tip_calculation', 20).notNullable(); // on_subtotal, on_total
      table.string('remainder_policy', 20).notNullable(); // first_person, rounding_pool
      table.boolean('is_default').defaultTo(false);
      table.timestamps(true, true);
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.dropTable('rounding_configs');
    await db.schema.dropTable('split_payments');
    await db.schema.dropTable('bill_splits');
  },
};

// ==========================================
// MIGRATION 005: Yield Profiles
// ==========================================

export const migration005_yield_profiles: Migration = {
  version: '005',
  name: 'add_yield_profiles',
  description: 'Add yield profiles for products with process-specific yields',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    await db.schema.createTable('yield_profiles', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable().unique();
      table.string('name', 100).notNullable();
      table.string('product_id', 50).references('document_id').inTable('products');
      table.decimal('base_yield_ratio', 5, 4).notNullable();
      table.jsonb('process_yields').defaultTo('[]');
      table.jsonb('waste_breakdown').defaultTo('[]');
      table.decimal('tolerance_percent', 5, 2).defaultTo(5);
      table.boolean('requires_calibration').defaultTo(false);
      table.timestamp('last_calibrated_at').nullable();
      table.string('calibrated_by', 50).nullable();
      table.timestamps(true, true);

      table.index(['product_id'], 'idx_yield_product');
    });

    // Add yield profile reference to products
    await db.schema.alterTable('products', (table) => {
      table.string('document_id', 50).notNullable().unique();
      table.string('slug', 100).notNullable().unique();
      table.jsonb('category_path').defaultTo('[]');
      table.string('barcode', 50).nullable();
      table.decimal('gross_weight', 12, 4).nullable();
      table.decimal('net_weight', 12, 4).nullable();
      table.string('yield_profile_id', 50).nullable().references('document_id').inTable('yield_profiles');
      table.string('default_process_type', 20).nullable();
      table.decimal('cost_per_unit', 12, 4).defaultTo(0);
      table.jsonb('suppliers').defaultTo('[]');

      table.index(['barcode'], 'idx_products_barcode');
      table.index(['yield_profile_id'], 'idx_products_yield');
      table.index(['category_path'], 'idx_products_category');
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.alterTable('products', (table) => {
      table.dropIndex('idx_products_barcode');
      table.dropIndex('idx_products_yield');
      table.dropIndex('idx_products_category');
      table.dropColumn('document_id');
      table.dropColumn('slug');
      table.dropColumn('category_path');
      table.dropColumn('barcode');
      table.dropColumn('gross_weight');
      table.dropColumn('net_weight');
      table.dropColumn('yield_profile_id');
      table.dropColumn('default_process_type');
      table.dropColumn('cost_per_unit');
      table.dropColumn('suppliers');
    });

    await db.schema.dropTable('yield_profiles');
  },
};

// ==========================================
// MIGRATION 006: Storage Batches
// ==========================================

export const migration006_storage_batches: Migration = {
  version: '006',
  name: 'add_storage_batches',
  description: 'Add batch tracking with processing history',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    await db.schema.createTable('storage_batches', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable().unique();
      table.string('product_id', 50).notNullable().references('document_id').inTable('products');
      table.string('yield_profile_id', 50).references('document_id').inTable('yield_profiles');
      table.decimal('gross_in', 12, 4).notNullable();
      table.decimal('unit_cost', 12, 4).notNullable();
      table.decimal('total_cost', 12, 4).notNullable();
      table.string('supplier_id', 50).nullable();
      table.string('invoice_number', 50).nullable();
      table.timestamp('received_at').notNullable();
      table.date('expiry_date').nullable();
      table.string('batch_number', 50).nullable();
      table.string('barcode', 50).nullable();
      table.jsonb('processes').defaultTo('[]');
      table.decimal('net_available', 12, 4).notNullable();
      table.decimal('used_amount', 12, 4).defaultTo(0);
      table.decimal('wasted_amount', 12, 4).defaultTo(0);
      table.string('status', 20).defaultTo('received');
      table.boolean('is_locked').defaultTo(false);
      table.string('locked_by', 50).nullable();
      table.timestamp('locked_at').nullable();
      table.timestamps(true, true);

      table.index(['product_id', 'status'], 'idx_batches_product_status');
      table.index(['expiry_date'], 'idx_batches_expiry');
      table.index(['barcode'], 'idx_batches_barcode');
      table.index(['received_at'], 'idx_batches_received');
      table.index(['status', 'net_available'], 'idx_batches_available');
    });

    await db.schema.createTable('storage_history', (table) => {
      table.string('document_id', 50).primary();
      table.string('product_id', 50).notNullable().references('document_id').inTable('products');
      table.string('batch_id', 50).nullable().references('document_id').inTable('storage_batches');
      table.string('operation_type', 20).notNullable();
      table.decimal('quantity', 12, 4).notNullable();
      table.string('unit', 10).notNullable();
      table.string('order_id', 50).nullable();
      table.string('recipe_id', 50).nullable();
      table.string('write_off_reason', 30).nullable();
      table.timestamp('timestamp').notNullable();
      table.string('operator_id', 50).notNullable();
      table.string('operator_name', 100).notNullable();
      table.text('notes').nullable();
      table.jsonb('metadata').nullable();
      table.timestamps(true, true);

      table.index(['product_id', 'timestamp'], 'idx_history_product_time');
      table.index(['batch_id'], 'idx_history_batch');
      table.index(['operation_type', 'timestamp'], 'idx_history_operation');
      table.index(['order_id'], 'idx_history_order');
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.dropTable('storage_history');
    await db.schema.dropTable('storage_batches');
  },
};

// ==========================================
// MIGRATION 007: Event Log
// ==========================================

export const migration007_event_log: Migration = {
  version: '007',
  name: 'add_event_log',
  description: 'Add unified event log for audit trail',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    await db.schema.createTable('event_log', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable();
      table.bigInteger('sequence').notNullable().unique();
      table.string('category', 30).notNullable();
      table.string('event_type', 50).notNullable();
      table.string('severity', 20).defaultTo('info');
      table.string('resource_type', 50).notNullable();
      table.string('resource_document_id', 50).notNullable();
      table.string('resource_slug', 100).nullable();
      table.string('parent_resource_type', 50).nullable();
      table.string('parent_resource_document_id', 50).nullable();
      table.string('previous_state', 30).nullable();
      table.string('new_state', 30).nullable();
      table.jsonb('previous_value').nullable();
      table.jsonb('new_value').nullable();
      table.jsonb('delta').nullable();
      table.string('actor_id', 50).notNullable();
      table.string('actor_name', 100).notNullable();
      table.string('actor_role', 30).notNullable();
      table.string('actor_ip', 45).nullable();
      table.text('actor_user_agent').nullable();
      table.string('session_id', 50).nullable();
      table.string('correlation_id', 50).nullable();
      table.string('request_id', 50).nullable();
      table.text('reason').nullable();
      table.string('reason_code', 50).nullable();
      table.string('approved_by', 50).nullable();
      table.timestamp('approval_timestamp').nullable();
      table.jsonb('metadata').nullable();
      table.jsonb('tags').nullable();
      table.timestamp('timestamp').notNullable();
      table.timestamp('server_timestamp').notNullable();
      table.timestamp('processed_at').nullable();

      // Performance indexes
      table.index(['category', 'timestamp'], 'idx_events_category_time');
      table.index(['event_type', 'timestamp'], 'idx_events_type_time');
      table.index(['resource_document_id', 'timestamp'], 'idx_events_resource');
      table.index(['actor_id', 'timestamp'], 'idx_events_actor');
      table.index(['correlation_id'], 'idx_events_correlation');
      table.index(['severity', 'timestamp'], 'idx_events_severity');
      table.index(['timestamp'], 'idx_events_timestamp');
    });

    // Create sequence for event ordering
    await db.execute(`CREATE SEQUENCE IF NOT EXISTS event_log_sequence START 1`);
  },

  async down(db: DatabaseConnection) {
    await db.execute(`DROP SEQUENCE IF EXISTS event_log_sequence`);
    await db.schema.dropTable('event_log');
  },
};

// ==========================================
// MIGRATION 008: Station SubTasks
// ==========================================

export const migration008_station_subtasks: Migration = {
  version: '008',
  name: 'add_station_subtasks',
  description: 'Add station routing and subtask tracking',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    // Kitchen stations
    await db.schema.createTable('kitchen_stations', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable().unique();
      table.string('type', 20).notNullable();
      table.string('name', 100).notNullable();
      table.string('name_uk', 100).notNullable();
      table.integer('display_order').defaultTo(0);
      table.string('color', 20).nullable();
      table.string('icon', 50).nullable();
      table.integer('max_concurrent').defaultTo(6);
      table.bigInteger('target_prep_time_ms').notNullable();
      table.bigInteger('warning_threshold_ms').notNullable();
      table.bigInteger('critical_threshold_ms').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_paused').defaultTo(false);
      table.text('pause_reason').nullable();
      table.timestamps(true, true);

      table.index(['type', 'is_active'], 'idx_stations_type');
    });

    // Menu item to station mapping
    await db.schema.createTable('menu_station_mappings', (table) => {
      table.string('document_id', 50).primary();
      table.string('menu_item_id', 50).notNullable();
      table.string('menu_item_slug', 100).notNullable();
      table.string('primary_station', 20).notNullable();
      table.jsonb('additional_stations').defaultTo('[]');
      table.bigInteger('total_estimated_time_ms').notNullable();
      table.boolean('auto_route').defaultTo(true);
      table.jsonb('routing_rules').nullable();
      table.timestamps(true, true);

      table.index(['menu_item_id'], 'idx_mappings_menu');
      table.unique(['menu_item_slug'], 'uq_mappings_slug');
    });

    // Station subtasks
    await db.schema.createTable('station_subtasks', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable().unique();
      table.string('order_item_document_id', 50).notNullable();
      table.string('order_document_id', 50).notNullable();
      table.string('station_type', 20).notNullable();
      table.string('station_document_id', 50).notNullable();
      table.text('task_description').notNullable();
      table.string('menu_item_name', 200).notNullable();
      table.integer('quantity').notNullable();
      table.integer('recipe_step_index').nullable();
      table.text('recipe_step_description').nullable();
      table.string('status', 20).defaultTo('pending');
      table.jsonb('status_history').defaultTo('[]');
      table.timestamp('created_at').notNullable();
      table.timestamp('queued_at').nullable();
      table.timestamp('started_at').nullable();
      table.timestamp('completed_at').nullable();
      table.timestamp('passed_at').nullable();
      table.bigInteger('elapsed_ms').defaultTo(0);
      table.timestamp('target_completion_at').notNullable();
      table.boolean('is_overdue').defaultTo(false);
      table.bigInteger('overdue_ms').defaultTo(0);
      table.string('assigned_chef_id', 50).nullable();
      table.string('assigned_chef_name', 100).nullable();
      table.string('priority', 10).defaultTo('normal');
      table.integer('priority_score').defaultTo(0);
      table.jsonb('depends_on').defaultTo('[]');
      table.jsonb('blocked_by').defaultTo('[]');
      table.text('notes').nullable();
      table.jsonb('modifiers').defaultTo('[]');
      table.timestamps(true, true);

      table.index(['order_item_document_id'], 'idx_subtasks_item');
      table.index(['station_type', 'status'], 'idx_subtasks_station_status');
      table.index(['status', 'priority_score'], 'idx_subtasks_priority');
      table.index(['assigned_chef_id', 'status'], 'idx_subtasks_chef');
      table.index(['target_completion_at'], 'idx_subtasks_deadline');
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.dropTable('station_subtasks');
    await db.schema.dropTable('menu_station_mappings');
    await db.schema.dropTable('kitchen_stations');
  },
};

// ==========================================
// MIGRATION 009: Employee Profiles
// ==========================================

export const migration009_employee_profiles: Migration = {
  version: '009',
  name: 'add_employee_profiles',
  description: 'Add extended employee profiles with KPI tracking',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    await db.schema.createTable('employee_profiles', (table) => {
      table.string('document_id', 50).primary();
      table.string('slug', 100).notNullable().unique();
      table.string('user_id', 50).notNullable();
      table.string('name', 100).notNullable();
      table.string('avatar', 500).nullable();
      table.string('role', 20).notNullable();
      table.string('department', 20).notNullable();
      table.string('status', 20).defaultTo('offline');
      table.jsonb('contact_info').defaultTo('{}');
      table.jsonb('shifts').defaultTo('[]');
      table.jsonb('current_shift').nullable();
      table.decimal('hours_this_week', 8, 2).defaultTo(0);
      table.decimal('hours_this_month', 8, 2).defaultTo(0);
      table.jsonb('kpi_targets').defaultTo('[]');
      table.jsonb('kpi_actuals').defaultTo('[]');
      table.string('chat_thread_id', 50).nullable();
      table.timestamp('last_active_at').nullable();
      table.timestamps(true, true);

      table.index(['user_id'], 'idx_profiles_user');
      table.index(['role', 'status'], 'idx_profiles_role');
      table.index(['department', 'status'], 'idx_profiles_dept');
    });

    await db.schema.createTable('shift_assignments', (table) => {
      table.string('document_id', 50).primary();
      table.string('profile_id', 50).notNullable().references('document_id').inTable('employee_profiles');
      table.date('date').notNullable();
      table.string('start_time', 5).notNullable();
      table.string('end_time', 5).notNullable();
      table.string('department', 20).notNullable();
      table.string('station', 20).nullable();
      table.string('status', 20).defaultTo('scheduled');
      table.timestamps(true, true);

      table.index(['profile_id', 'date'], 'idx_shifts_profile_date');
      table.index(['date', 'department'], 'idx_shifts_date_dept');
    });

    await db.schema.createTable('kpi_snapshots', (table) => {
      table.string('document_id', 50).primary();
      table.string('profile_id', 50).notNullable().references('document_id').inTable('employee_profiles');
      table.string('metric', 30).notNullable();
      table.string('period', 10).notNullable(); // YYYY-MM-DD or YYYY-WW or YYYY-MM
      table.decimal('value', 12, 4).notNullable();
      table.decimal('target', 12, 4).nullable();
      table.timestamp('calculated_at').notNullable();
      table.timestamps(true, true);

      table.index(['profile_id', 'metric', 'period'], 'idx_kpi_profile_metric');
      table.unique(['profile_id', 'metric', 'period'], 'uq_kpi_snapshot');
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.dropTable('kpi_snapshots');
    await db.schema.dropTable('shift_assignments');
    await db.schema.dropTable('employee_profiles');
  },
};

// ==========================================
// MIGRATION 010: Feature Flags
// ==========================================

export const migration010_feature_flags: Migration = {
  version: '010',
  name: 'add_feature_flags',
  description: 'Add feature flag management tables',
  createdAt: '2025-12-21',

  async up(db: DatabaseConnection) {
    await db.schema.createTable('feature_flags', (table) => {
      table.string('key', 50).primary();
      table.string('name', 100).notNullable();
      table.string('name_uk', 100).notNullable();
      table.text('description').nullable();
      table.text('description_uk').nullable();
      table.string('module', 30).notNullable();
      table.string('state', 20).defaultTo('off');
      table.integer('percentage').nullable();
      table.jsonb('targeted_roles').nullable();
      table.jsonb('targeted_user_ids').nullable();
      table.jsonb('targeted_table_numbers').nullable();
      table.jsonb('dependencies').nullable();
      table.jsonb('incompatible_with').nullable();
      table.string('created_by', 50).notNullable();
      table.timestamp('rollout_started_at').nullable();
      table.timestamp('rollout_completed_at').nullable();
      table.timestamps(true, true);

      table.index(['module', 'state'], 'idx_flags_module');
    });

    await db.schema.createTable('feature_flag_history', (table) => {
      table.string('document_id', 50).primary();
      table.string('flag_key', 50).notNullable().references('key').inTable('feature_flags');
      table.string('previous_state', 20).nullable();
      table.string('new_state', 20).notNullable();
      table.jsonb('previous_config').nullable();
      table.jsonb('new_config').nullable();
      table.string('changed_by', 50).notNullable();
      table.text('reason').nullable();
      table.timestamps(true, true);

      table.index(['flag_key', 'created_at'], 'idx_flag_history');
    });

    await db.schema.createTable('rollout_plans', (table) => {
      table.string('document_id', 50).primary();
      table.string('flag_key', 50).notNullable().references('key').inTable('feature_flags');
      table.jsonb('stages').notNullable();
      table.integer('current_stage').defaultTo(0);
      table.string('status', 20).defaultTo('pending');
      table.timestamp('started_at').nullable();
      table.timestamp('completed_at').nullable();
      table.string('created_by', 50).notNullable();
      table.timestamps(true, true);

      table.index(['flag_key', 'status'], 'idx_rollout_flag');
    });
  },

  async down(db: DatabaseConnection) {
    await db.schema.dropTable('rollout_plans');
    await db.schema.dropTable('feature_flag_history');
    await db.schema.dropTable('feature_flags');
  },
};

// ==========================================
// MIGRATION RUNNER
// ==========================================

export const ALL_MIGRATIONS: Migration[] = [
  migration001_course_fields,
  migration002_comments,
  migration003_table_sessions,
  migration004_bill_splits,
  migration005_yield_profiles,
  migration006_storage_batches,
  migration007_event_log,
  migration008_station_subtasks,
  migration009_employee_profiles,
  migration010_feature_flags,
];

export interface MigrationStatus {
  version: string;
  name: string;
  appliedAt?: string;
  status: 'pending' | 'applied' | 'failed';
  error?: string;
}

export async function runMigrations(
  db: DatabaseConnection,
  targetVersion?: string
): Promise<MigrationStatus[]> {
  const results: MigrationStatus[] = [];

  // Ensure migrations table exists
  const hasTable = await db.schema.hasTable('_migrations');
  if (!hasTable) {
    await db.schema.createTable('_migrations', (table) => {
      table.string('version', 10).primary();
      table.string('name', 100).notNullable();
      table.timestamp('applied_at').notNullable();
    });
  }

  // Get applied migrations
  const applied = await db.query<{ version: string }>('SELECT version FROM _migrations');
  const appliedVersions = new Set(applied.map((m) => m.version));

  for (const migration of ALL_MIGRATIONS) {
    if (targetVersion && migration.version > targetVersion) {
      break;
    }

    if (appliedVersions.has(migration.version)) {
      results.push({
        version: migration.version,
        name: migration.name,
        status: 'applied',
      });
      continue;
    }

    try {
      await db.transaction(async (trx) => {
        await migration.up(trx);

        if (migration.backfill) {
          await migration.backfill(trx);
        }

        await trx.execute(
          'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.name, new Date().toISOString()]
        );
      });

      results.push({
        version: migration.version,
        name: migration.name,
        appliedAt: new Date().toISOString(),
        status: 'applied',
      });
    } catch (error) {
      results.push({
        version: migration.version,
        name: migration.name,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      break; // Stop on first failure
    }
  }

  return results;
}

export async function rollbackMigration(
  db: DatabaseConnection,
  version: string
): Promise<MigrationStatus> {
  const migration = ALL_MIGRATIONS.find((m) => m.version === version);

  if (!migration) {
    return {
      version,
      name: 'Unknown',
      status: 'failed',
      error: 'Migration not found',
    };
  }

  try {
    await db.transaction(async (trx) => {
      await migration.down(trx);
      await trx.execute('DELETE FROM _migrations WHERE version = ?', [version]);
    });

    return {
      version,
      name: migration.name,
      status: 'pending',
    };
  } catch (error) {
    return {
      version,
      name: migration.name,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
