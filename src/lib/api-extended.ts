/**
 * Extended API Module
 *
 * Mock API endpoints for courses, comments, bill splitting,
 * SmartStorage, and employee profiles.
 *
 * Ready for Strapi/backend integration.
 * Uses documentId and slug instead of id.
 */

import type {
  ExtendedOrder,
  ExtendedOrderItem,
  CourseType,
  OrderItemStatus,
  ItemComment,
  UndoEntry,
  TableSession,
  BillSplit,
  SplitMode,
  SplitParticipant,
  ExtendedProduct,
  YieldProfile,
  StorageBatch,
  BatchProcess,
  StorageHistory,
  ProcessType,
  EmployeeProfile,
  KPIDashboard,
  ExtendedApiResponse,
  CommentPreset,
} from '@/types/extended';
import { COMMENT_PRESETS } from '@/types/extended';

// ==========================================
// CONFIGURATION
// ==========================================

const API_DELAY = 300; // Simulated network delay

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function delay(ms: number = API_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateDocumentId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSlug(base: string): string {
  return `${base}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
}

// ==========================================
// ORDERS API
// ==========================================

/**
 * Update order item (course, comment, status)
 * PATCH /orders/{documentId}/items/{slug}
 */
export async function updateOrderItem(
  orderDocumentId: string,
  itemSlug: string,
  updates: {
    courseType?: CourseType;
    courseIndex?: number;
    comment?: ItemComment;
    status?: OrderItemStatus;
  }
): Promise<ExtendedApiResponse<ExtendedOrderItem>> {
  await delay();

  // Mock implementation - in real app, would call backend
  const item: ExtendedOrderItem = {
    documentId: generateDocumentId('item'),
    slug: itemSlug,
    menuItemId: 'menu_1',
    menuItem: {
      id: 'menu_1',
      name: 'Mock Item',
      description: '',
      price: 100,
      categoryId: 'cat_1',
      available: true,
      preparationTime: 10,
    },
    quantity: 1,
    status: updates.status || 'pending',
    courseType: updates.courseType || 'main',
    courseIndex: updates.courseIndex || 0,
    comment: updates.comment,
    commentHistory: [],
    prepElapsedMs: 0,
  };

  return {
    data: item,
    success: true,
  };
}

/**
 * Undo item status
 * POST /orders/{documentId}/items/{slug}/undo
 */
export async function undoItemStatus(
  orderDocumentId: string,
  itemSlug: string,
  reason: string,
  targetStatus: OrderItemStatus
): Promise<ExtendedApiResponse<{ item: ExtendedOrderItem; undoEntry: UndoEntry }>> {
  await delay();

  const undoEntry: UndoEntry = {
    timestamp: new Date().toISOString(),
    operatorId: 'current_user',
    operatorName: 'Current User',
    previousStatus: 'ready',
    newStatus: targetStatus,
    reason,
    itemDocumentId: generateDocumentId('item'),
  };

  return {
    data: {
      item: {
        documentId: undoEntry.itemDocumentId,
        slug: itemSlug,
        menuItemId: 'menu_1',
        menuItem: {
          id: 'menu_1',
          name: 'Mock Item',
          description: '',
          price: 100,
          categoryId: 'cat_1',
          available: true,
          preparationTime: 10,
        },
        quantity: 1,
        status: targetStatus,
        courseType: 'main',
        courseIndex: 0,
        commentHistory: [],
        prepElapsedMs: 0,
        undoRef: undoEntry.timestamp,
      },
      undoEntry,
    },
    success: true,
  };
}

/**
 * Create or update bill split
 * POST /orders/{documentId}/split
 */
export async function createBillSplit(
  orderDocumentId: string,
  mode: SplitMode,
  participants: Omit<SplitParticipant, 'subtotal' | 'tax' | 'tip' | 'total'>[],
  tipPercent: number = 0
): Promise<ExtendedApiResponse<BillSplit>> {
  await delay();

  // Calculate totals (mock)
  const calculatedParticipants: SplitParticipant[] = participants.map((p, index) => ({
    ...p,
    subtotal: 100 + index * 50,
    tax: 10 + index * 5,
    tip: tipPercent > 0 ? (100 + index * 50) * (tipPercent / 100) : 0,
    total: 110 + index * 55 + (tipPercent > 0 ? (100 + index * 50) * (tipPercent / 100) : 0),
  }));

  const split: BillSplit = {
    documentId: generateDocumentId('split'),
    slug: generateSlug(`split-${orderDocumentId}`),
    orderId: orderDocumentId,
    mode,
    participants: calculatedParticipants,
    totals: {
      subtotal: calculatedParticipants.reduce((sum, p) => sum + p.subtotal, 0),
      tax: calculatedParticipants.reduce((sum, p) => sum + p.tax, 0),
      tip: calculatedParticipants.reduce((sum, p) => sum + p.tip, 0),
      total: calculatedParticipants.reduce((sum, p) => sum + p.total, 0),
      unassigned: 0,
    },
    createdAt: new Date().toISOString(),
    createdBy: 'current_user',
    status: 'draft',
  };

  return {
    data: split,
    success: true,
  };
}

// ==========================================
// TABLE TIME API
// ==========================================

/**
 * Get table timer and per-course timings
 * GET /tables/{slug}/time
 */
export async function getTableTime(
  tableSlug: string
): Promise<ExtendedApiResponse<TableSession>> {
  await delay();

  const session: TableSession = {
    documentId: generateDocumentId('session'),
    slug: tableSlug,
    tableNumber: parseInt(tableSlug.replace('table-', '')) || 1,
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: 'active',
    guestCount: 4,
    waiterId: 'waiter_1',
    orders: [],
    elapsedMs: 3600000,
    courseTimings: [
      {
        courseType: 'appetizer',
        startedAt: new Date(Date.now() - 3300000).toISOString(),
        completedAt: new Date(Date.now() - 2700000).toISOString(),
        elapsedMs: 600000,
        itemCount: 2,
      },
      {
        courseType: 'main',
        startedAt: new Date(Date.now() - 2100000).toISOString(),
        elapsedMs: 2100000,
        itemCount: 4,
      },
    ],
  };

  return {
    data: session,
    success: true,
  };
}

// ==========================================
// COMMENTS API
// ==========================================

/**
 * Add comment to item
 * POST /orders/{documentId}/items/{slug}/comments
 */
export async function addItemComment(
  orderDocumentId: string,
  itemSlug: string,
  comment: Omit<ItemComment, 'createdAt' | 'createdBy'>
): Promise<ExtendedApiResponse<ItemComment>> {
  await delay();

  const fullComment: ItemComment = {
    ...comment,
    createdAt: new Date().toISOString(),
    createdBy: 'current_user',
  };

  return {
    data: fullComment,
    success: true,
  };
}

/**
 * Get comment presets
 * GET /config/comment-presets
 */
export async function getCommentPresets(): Promise<
  ExtendedApiResponse<{
    modifiers: CommentPreset[];
    allergies: CommentPreset[];
    dietary: CommentPreset[];
  }>
> {
  await delay(100); // Faster for config

  const modifiers = COMMENT_PRESETS.filter((p) => p.category === 'modifier');
  const allergies = COMMENT_PRESETS.filter((p) => p.category === 'allergy');
  const dietary = COMMENT_PRESETS.filter((p) => p.category === 'dietary');

  return {
    data: { modifiers, allergies, dietary },
    success: true,
  };
}

// ==========================================
// SMART STORAGE API
// ==========================================

/**
 * Receive new batch
 * POST /storage/batch
 */
export async function receiveBatch(
  batch: Omit<StorageBatch, 'documentId' | 'slug' | 'processes' | 'usedAmount' | 'wastedAmount' | 'status'>
): Promise<ExtendedApiResponse<StorageBatch>> {
  await delay();

  const fullBatch: StorageBatch = {
    ...batch,
    documentId: generateDocumentId('batch'),
    slug: generateSlug(`batch-${batch.productId}`),
    processes: [],
    usedAmount: 0,
    wastedAmount: 0,
    status: 'received',
  };

  return {
    data: fullBatch,
    success: true,
  };
}

/**
 * Process batch with cleaning
 * POST /storage/process/cleaning
 */
export async function processClean(
  batchId: string,
  grossInput: number,
  notes?: string
): Promise<ExtendedApiResponse<{ process: BatchProcess; batch: StorageBatch }>> {
  await delay();

  // Mock yield calculation
  const yieldRatio = 0.72;
  const netOutput = grossInput * yieldRatio;
  const wasteOutput = grossInput - netOutput;

  const process: BatchProcess = {
    documentId: generateDocumentId('process'),
    processType: 'cleaning',
    processedAt: new Date().toISOString(),
    operatorId: 'current_user',
    operatorName: 'Current User',
    grossInput,
    netOutput,
    wasteOutput,
    expectedYield: yieldRatio,
    actualYield: yieldRatio,
    variancePercent: 0,
    notes,
  };

  const batch: StorageBatch = {
    documentId: batchId,
    slug: 'mock-batch',
    productId: 'prod_1',
    yieldProfileId: 'yield_1',
    grossIn: grossInput,
    unitCost: 100,
    totalCost: grossInput * 100,
    supplierId: 'supp_1',
    receivedAt: new Date().toISOString(),
    processes: [process],
    netAvailable: netOutput,
    usedAmount: 0,
    wastedAmount: wasteOutput,
    status: 'available',
  };

  return {
    data: { process, batch },
    success: true,
  };
}

/**
 * Process batch with boiling
 * POST /storage/process/boiling
 */
export async function processBoil(
  batchId: string,
  grossInput: number,
  processTemp: number,
  processTime: number,
  notes?: string
): Promise<ExtendedApiResponse<{ process: BatchProcess; batch: StorageBatch }>> {
  await delay();

  const moistureLoss = 0.3;
  const netOutput = grossInput * (1 - moistureLoss);

  const process: BatchProcess = {
    documentId: generateDocumentId('process'),
    processType: 'boiling',
    processedAt: new Date().toISOString(),
    operatorId: 'current_user',
    operatorName: 'Current User',
    grossInput,
    netOutput,
    wasteOutput: 0,
    moistureLoss,
    processTemp,
    processTime,
    expectedYield: 1 - moistureLoss,
    actualYield: 1 - moistureLoss,
    variancePercent: 0,
    notes,
  };

  const batch: StorageBatch = {
    documentId: batchId,
    slug: 'mock-batch',
    productId: 'prod_1',
    yieldProfileId: 'yield_1',
    grossIn: grossInput,
    unitCost: 100,
    totalCost: grossInput * 100,
    supplierId: 'supp_1',
    receivedAt: new Date().toISOString(),
    processes: [process],
    netAvailable: netOutput,
    usedAmount: 0,
    wastedAmount: 0,
    status: 'available',
  };

  return {
    data: { process, batch },
    success: true,
  };
}

/**
 * Process batch with frying
 * POST /storage/process/frying
 */
export async function processFry(
  batchId: string,
  grossInput: number,
  processTemp: number,
  processTime: number,
  oilUsed: number,
  notes?: string
): Promise<ExtendedApiResponse<{ process: BatchProcess; batch: StorageBatch }>> {
  await delay();

  const moistureLoss = 0.2;
  const oilAbsorption = 0.08;
  const netOutput = grossInput * (1 - moistureLoss + oilAbsorption);

  const process: BatchProcess = {
    documentId: generateDocumentId('process'),
    processType: 'frying',
    processedAt: new Date().toISOString(),
    operatorId: 'current_user',
    operatorName: 'Current User',
    grossInput,
    netOutput,
    wasteOutput: 0,
    moistureLoss,
    oilAbsorption,
    processTemp,
    processTime,
    expectedYield: 1 - moistureLoss + oilAbsorption,
    actualYield: 1 - moistureLoss + oilAbsorption,
    variancePercent: 0,
    notes,
  };

  const batch: StorageBatch = {
    documentId: batchId,
    slug: 'mock-batch',
    productId: 'prod_1',
    yieldProfileId: 'yield_1',
    grossIn: grossInput,
    unitCost: 100,
    totalCost: grossInput * 100,
    supplierId: 'supp_1',
    receivedAt: new Date().toISOString(),
    processes: [process],
    netAvailable: netOutput,
    usedAmount: 0,
    wastedAmount: 0,
    status: 'available',
  };

  return {
    data: { process, batch },
    success: true,
  };
}

/**
 * Get storage history with filters
 * GET /storage/history
 */
export async function getStorageHistory(filters?: {
  productId?: string;
  batchId?: string;
  operationType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<ExtendedApiResponse<StorageHistory[]> & { pagination: { total: number; page: number; pageSize: number; hasMore: boolean } }> {
  await delay();

  // Mock history data
  const history: StorageHistory[] = [
    {
      documentId: 'hist_1',
      productId: 'prod_1',
      productName: 'Яловичина вирізка',
      batchId: 'batch_1',
      operationType: 'receive',
      quantity: 10.5,
      unit: 'kg',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      operatorId: 'user_1',
      operatorName: 'Іван Коваль',
      notes: 'Invoice: INV-2025-001',
    },
    {
      documentId: 'hist_2',
      productId: 'prod_1',
      productName: 'Яловичина вирізка',
      batchId: 'batch_1',
      operationType: 'clean',
      quantity: 7.56,
      unit: 'kg',
      timestamp: new Date(Date.now() - 82800000).toISOString(),
      operatorId: 'user_1',
      operatorName: 'Іван Коваль',
      notes: 'Стандартна очистка',
    },
  ];

  return {
    data: history,
    success: true,
    pagination: {
      total: history.length,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 50,
      hasMore: false,
    },
  };
}

/**
 * Export storage data
 * GET /storage/export
 */
export async function exportStorageData(
  format: 'csv' | 'tsv',
  type: 'inventory' | 'batches' | 'history' | 'yields',
  filters?: Record<string, string>
): Promise<ExtendedApiResponse<string>> {
  await delay();

  // Mock CSV data
  const csvData = `document_id,product_name,batch_id,operation,quantity,unit,timestamp,operator
hist_1,Яловичина вирізка,batch_1,receive,10.5,kg,2025-12-20T10:00:00Z,Іван Коваль
hist_2,Яловичина вирізка,batch_1,clean,7.56,kg,2025-12-20T11:00:00Z,Іван Коваль`;

  return {
    data: format === 'tsv' ? csvData.replace(/,/g, '\t') : csvData,
    success: true,
  };
}

// ==========================================
// PROFILES API
// ==========================================

/**
 * Get employee profile
 * GET /profiles/{slug}
 */
export async function getProfile(
  slug: string
): Promise<ExtendedApiResponse<EmployeeProfile>> {
  await delay();

  const profile: EmployeeProfile = {
    documentId: generateDocumentId('prof'),
    slug,
    userId: 'user_1',
    name: 'Іван Коваль',
    role: 'chef',
    department: 'kitchen',
    status: 'active',
    contactInfo: {
      phone: '+380 67 123 4567',
      email: 'ivan.koval@restaurant.ua',
    },
    shifts: [
      {
        documentId: 'shift_1',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '16:00',
        department: 'kitchen',
        station: 'grill',
        status: 'started',
      },
    ],
    currentShift: {
      documentId: 'shift_1',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '16:00',
      department: 'kitchen',
      station: 'grill',
      status: 'started',
    },
    hoursThisWeek: 32.5,
    hoursThisMonth: 128,
    kpiTargets: [
      { metric: 'dishes_prepared', period: 'daily', target: 50, unit: 'dishes' },
      { metric: 'average_ticket_time', period: 'daily', target: 10, unit: 'min' },
    ],
    kpiActuals: [
      { metric: 'dishes_prepared', period: new Date().toISOString().split('T')[0], value: 47, updatedAt: new Date().toISOString() },
      { metric: 'average_ticket_time', period: new Date().toISOString().split('T')[0], value: 8.5, updatedAt: new Date().toISOString() },
    ],
    lastActiveAt: new Date().toISOString(),
  };

  return {
    data: profile,
    success: true,
  };
}

/**
 * Get KPI dashboard
 * GET /kpi/dashboard
 */
export async function getKPIDashboard(
  period: 'today' | 'week' | 'month' = 'today',
  department?: string,
  role?: string
): Promise<ExtendedApiResponse<KPIDashboard>> {
  await delay();

  const dashboard: KPIDashboard = {
    period,
    summary: {
      totalOrders: 127,
      averageTicketTime: 12.3,
      totalRevenue: 45680,
      wasteRate: 0.034,
    },
    byDepartment: {
      kitchen: {
        dishesCompleted: 342,
        averageTime: 9.8,
        staff: 5,
      },
      service: {
        ordersServed: 127,
        averageRating: 4.7,
        averageTime: 5.2,
        staff: 8,
      },
      bar: {
        dishesCompleted: 89,
        averageTime: 3.2,
        staff: 2,
      },
      management: {
        averageTime: 0,
        staff: 2,
      },
      host: {
        averageTime: 0,
        staff: 1,
      },
    },
    topPerformers: [
      {
        profileId: 'prof_1',
        name: 'Іван Коваль',
        metric: 'dishes_prepared',
        value: 67,
      },
      {
        profileId: 'prof_2',
        name: 'Олена Петренко',
        metric: 'orders_served',
        value: 32,
      },
    ],
    alerts: [
      {
        type: 'understaffed',
        department: 'kitchen',
        message: 'Потрібен ще 1 кухар на вечірню зміну',
      },
    ],
  };

  return {
    data: dashboard,
    success: true,
  };
}

// ==========================================
// YIELD PROFILES API
// ==========================================

/**
 * Get yield profiles
 * GET /storage/yield-profiles
 */
export async function getYieldProfiles(): Promise<ExtendedApiResponse<YieldProfile[]>> {
  await delay();

  const profiles: YieldProfile[] = [
    {
      documentId: 'yield_beef',
      slug: 'beef-tenderloin-premium',
      name: 'Beef Tenderloin Premium',
      productId: 'prod_beef',
      baseYieldRatio: 0.72,
      processYields: [
        {
          processType: 'grilling',
          yieldRatio: 0.85,
          moistureLoss: 0.15,
          temperatureRange: [180, 220],
          timeRange: [8, 15],
        },
        {
          processType: 'boiling',
          yieldRatio: 0.7,
          moistureLoss: 0.3,
          temperatureRange: [95, 100],
          timeRange: [90, 180],
        },
      ],
      wasteBreakdown: [
        { name: 'fat', percentage: 0.15, disposalType: 'stock' },
        { name: 'silver_skin', percentage: 0.1, disposalType: 'trash' },
        { name: 'trim', percentage: 0.03, disposalType: 'stock' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      documentId: 'yield_chicken',
      slug: 'chicken-whole',
      name: 'Chicken Whole',
      productId: 'prod_chicken',
      baseYieldRatio: 0.65,
      processYields: [
        {
          processType: 'frying',
          yieldRatio: 0.88,
          moistureLoss: 0.2,
          oilAbsorption: 0.08,
          temperatureRange: [160, 180],
          timeRange: [12, 18],
        },
        {
          processType: 'grilling',
          yieldRatio: 0.82,
          moistureLoss: 0.18,
          temperatureRange: [180, 200],
          timeRange: [25, 40],
        },
      ],
      wasteBreakdown: [
        { name: 'bones', percentage: 0.2, disposalType: 'stock' },
        { name: 'skin', percentage: 0.1, disposalType: 'recyclable' },
        { name: 'organs', percentage: 0.05, disposalType: 'trash' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return {
    data: profiles,
    success: true,
  };
}

/**
 * Create yield profile
 * POST /storage/yield-profiles
 */
export async function createYieldProfile(
  profile: Omit<YieldProfile, 'documentId' | 'createdAt' | 'updatedAt'>
): Promise<ExtendedApiResponse<YieldProfile>> {
  await delay();

  const fullProfile: YieldProfile = {
    ...profile,
    documentId: generateDocumentId('yield'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    data: fullProfile,
    success: true,
  };
}

// ==========================================
// PRODUCTS API (Extended)
// ==========================================

/**
 * Get extended products with yield info
 * GET /storage/products
 */
export async function getExtendedProducts(): Promise<ExtendedApiResponse<ExtendedProduct[]>> {
  await delay();

  const products: ExtendedProduct[] = [
    {
      documentId: 'prod_beef',
      slug: 'beef-tenderloin',
      name: 'Яловичина вирізка',
      sku: 'BEEF-TEND-001',
      unit: 'kg',
      currentStock: 12.5,
      minStock: 5,
      maxStock: 20,
      category: 'Meat',
      categoryPath: ['Meat', 'Beef', 'Tenderloin'],
      barcode: '4820000001234',
      yieldProfileId: 'yield_beef',
      defaultProcessType: 'grilling',
      costPerUnit: 450,
      suppliers: ['supp_1', 'supp_2'],
      lastUpdated: new Date().toISOString(),
    },
    {
      documentId: 'prod_chicken',
      slug: 'chicken-whole',
      name: 'Курка ціла',
      sku: 'CHKN-WHL-001',
      unit: 'kg',
      currentStock: 8.2,
      minStock: 3,
      maxStock: 15,
      category: 'Meat',
      categoryPath: ['Meat', 'Poultry', 'Chicken'],
      barcode: '4820000001235',
      yieldProfileId: 'yield_chicken',
      defaultProcessType: 'grilling',
      costPerUnit: 120,
      suppliers: ['supp_1'],
      lastUpdated: new Date().toISOString(),
    },
    {
      documentId: 'prod_potato',
      slug: 'potato',
      name: 'Картопля',
      sku: 'VEG-POT-001',
      unit: 'kg',
      currentStock: 25,
      minStock: 10,
      maxStock: 50,
      category: 'Vegetables',
      categoryPath: ['Vegetables', 'Root', 'Potato'],
      barcode: '4820000001236',
      defaultProcessType: 'boiling',
      costPerUnit: 18,
      suppliers: ['supp_3'],
      lastUpdated: new Date().toISOString(),
    },
  ];

  return {
    data: products,
    success: true,
  };
}

// ==========================================
// BATCHES API
// ==========================================

/**
 * Get batches
 * GET /storage/batches
 */
export async function getBatches(): Promise<ExtendedApiResponse<StorageBatch[]>> {
  await delay();

  const now = Date.now();
  const batches: StorageBatch[] = [
    // Отримана партія - готова до обробки
    {
      documentId: 'batch_1',
      slug: 'beef-lot-20251220',
      productId: 'prod_beef',
      productName: 'Яловичина вирізка',
      yieldProfileId: 'yield_beef',
      grossIn: 10.5,
      unitCost: 450,
      totalCost: 4725,
      supplierId: 'supp_1',
      invoiceNumber: 'INV-2025-001',
      receivedAt: new Date(now - 86400000).toISOString(),
      expiryDate: new Date(now + 7 * 86400000).toISOString().split('T')[0],
      batchNumber: 'LOT-20251220',
      barcode: '4820000001234-001',
      processes: [],
      netAvailable: 10.5,
      usedAmount: 0,
      wastedAmount: 0,
      status: 'received',
      isLocked: false,
    },
    // Оброблена партія - готова до використання
    {
      documentId: 'batch_2',
      slug: 'chicken-breast-20251221',
      productId: 'prod_chicken',
      productName: 'Куряче філе',
      yieldProfileId: 'yield_chicken',
      grossIn: 15.0,
      unitCost: 280,
      totalCost: 4200,
      supplierId: 'supp_2',
      invoiceNumber: 'INV-2025-002',
      receivedAt: new Date(now - 2 * 86400000).toISOString(),
      expiryDate: new Date(now + 5 * 86400000).toISOString().split('T')[0],
      batchNumber: 'LOT-20251221',
      barcode: '4820000001235-002',
      processes: [
        {
          documentId: 'proc_2',
          processType: 'cleaning',
          processedAt: new Date(now - 2 * 86400000 + 3600000).toISOString(),
          operatorId: 'user_1',
          operatorName: 'Іван Коваль',
          grossInput: 15.0,
          netOutput: 12.75,
          wasteOutput: 2.25,
          expectedYield: 0.85,
          actualYield: 0.85,
          variancePercent: 0,
        },
      ],
      netAvailable: 12.75,
      usedAmount: 0,
      wastedAmount: 2.25,
      status: 'processed',
      isLocked: false,
    },
    // Партія у використанні - частково використана
    {
      documentId: 'batch_3',
      slug: 'pork-shoulder-20251219',
      productId: 'prod_pork',
      productName: 'Свинина лопатка',
      yieldProfileId: 'yield_pork',
      grossIn: 20.0,
      unitCost: 320,
      totalCost: 6400,
      supplierId: 'supp_1',
      invoiceNumber: 'INV-2025-003',
      receivedAt: new Date(now - 3 * 86400000).toISOString(),
      expiryDate: new Date(now + 4 * 86400000).toISOString().split('T')[0],
      batchNumber: 'LOT-20251219',
      barcode: '4820000001236-003',
      processes: [
        {
          documentId: 'proc_3',
          processType: 'cleaning',
          processedAt: new Date(now - 3 * 86400000 + 7200000).toISOString(),
          operatorId: 'user_2',
          operatorName: 'Марія Петренко',
          grossInput: 20.0,
          netOutput: 16.0,
          wasteOutput: 4.0,
          expectedYield: 0.80,
          actualYield: 0.80,
          variancePercent: 0,
        },
        {
          documentId: 'proc_4',
          processType: 'boiling',
          processedAt: new Date(now - 2 * 86400000).toISOString(),
          operatorId: 'user_2',
          operatorName: 'Марія Петренко',
          grossInput: 16.0,
          netOutput: 12.8,
          wasteOutput: 3.2,
          expectedYield: 0.80,
          actualYield: 0.80,
          variancePercent: 0,
        },
      ],
      netAvailable: 8.5,
      usedAmount: 4.3,
      wastedAmount: 7.2,
      status: 'in_use',
      isLocked: false,
    },
    // Партія з низьким залишком - потребує уваги
    {
      documentId: 'batch_4',
      slug: 'fish-salmon-20251218',
      productId: 'prod_salmon',
      productName: 'Лосось філе',
      yieldProfileId: 'yield_fish',
      grossIn: 8.0,
      unitCost: 650,
      totalCost: 5200,
      supplierId: 'supp_3',
      invoiceNumber: 'INV-2025-004',
      receivedAt: new Date(now - 4 * 86400000).toISOString(),
      expiryDate: new Date(now + 2 * 86400000).toISOString().split('T')[0],
      batchNumber: 'LOT-20251218',
      barcode: '4820000001237-004',
      processes: [
        {
          documentId: 'proc_5',
          processType: 'cleaning',
          processedAt: new Date(now - 4 * 86400000 + 5400000).toISOString(),
          operatorId: 'user_1',
          operatorName: 'Іван Коваль',
          grossInput: 8.0,
          netOutput: 7.2,
          wasteOutput: 0.8,
          expectedYield: 0.90,
          actualYield: 0.90,
          variancePercent: 0,
        },
      ],
      netAvailable: 1.2,
      usedAmount: 6.0,
      wastedAmount: 0.8,
      status: 'in_use',
      isLocked: false,
    },
    // Партія з позитивним відхиленням yield
    {
      documentId: 'batch_5',
      slug: 'vegetables-carrot-20251222',
      productId: 'prod_carrot',
      productName: 'Морква свіжа',
      yieldProfileId: 'yield_vegetables',
      grossIn: 25.0,
      unitCost: 45,
      totalCost: 1125,
      supplierId: 'supp_2',
      invoiceNumber: 'INV-2025-005',
      receivedAt: new Date(now - 86400000).toISOString(),
      expiryDate: new Date(now + 10 * 86400000).toISOString().split('T')[0],
      batchNumber: 'LOT-20251222',
      barcode: '4820000001238-005',
      processes: [
        {
          documentId: 'proc_6',
          processType: 'peeling',
          processedAt: new Date(now - 86400000 + 1800000).toISOString(),
          operatorId: 'user_3',
          operatorName: 'Олександр Сидоренко',
          grossInput: 25.0,
          netOutput: 22.5,
          wasteOutput: 2.5,
          expectedYield: 0.88,
          actualYield: 0.90,
          variancePercent: 2.27,
        },
      ],
      netAvailable: 22.5,
      usedAmount: 0,
      wastedAmount: 2.5,
      status: 'processed',
      isLocked: false,
    },
    // Партія з негативним відхиленням yield
    {
      documentId: 'batch_6',
      slug: 'potatoes-20251217',
      productId: 'prod_potatoes',
      productName: 'Картопля столова',
      yieldProfileId: 'yield_potatoes',
      grossIn: 30.0,
      unitCost: 25,
      totalCost: 750,
      supplierId: 'supp_1',
      invoiceNumber: 'INV-2025-006',
      receivedAt: new Date(now - 5 * 86400000).toISOString(),
      expiryDate: new Date(now + 20 * 86400000).toISOString().split('T')[0],
      batchNumber: 'LOT-20251217',
      barcode: '4820000001239-006',
      processes: [
        {
          documentId: 'proc_7',
          processType: 'peeling',
          processedAt: new Date(now - 5 * 86400000 + 3600000).toISOString(),
          operatorId: 'user_2',
          operatorName: 'Марія Петренко',
          grossInput: 30.0,
          netOutput: 24.0,
          wasteOutput: 6.0,
          expectedYield: 0.85,
          actualYield: 0.80,
          variancePercent: -5.88,
        },
      ],
      netAvailable: 15.5,
      usedAmount: 8.5,
      wastedAmount: 6.0,
      status: 'in_use',
      isLocked: false,
    },
    // Партія з терміном, що закінчується
    {
      documentId: 'batch_7',
      slug: 'dairy-milk-20251215',
      productId: 'prod_milk',
      productName: 'Молоко пастеризоване',
      yieldProfileId: 'yield_dairy',
      grossIn: 50.0,
      unitCost: 35,
      totalCost: 1750,
      supplierId: 'supp_3',
      invoiceNumber: 'INV-2025-007',
      receivedAt: new Date(now - 7 * 86400000).toISOString(),
      expiryDate: new Date(now + 1 * 86400000).toISOString().split('T')[0],
      batchNumber: 'LOT-20251215',
      barcode: '4820000001240-007',
      processes: [],
      netAvailable: 35.0,
      usedAmount: 15.0,
      wastedAmount: 0,
      status: 'in_use',
      isLocked: false,
    },
    // Вичерпана партія
    {
      documentId: 'batch_8',
      slug: 'onions-20251210',
      productId: 'prod_onions',
      productName: 'Цибуля ріпчаста',
      yieldProfileId: 'yield_vegetables',
      grossIn: 20.0,
      unitCost: 30,
      totalCost: 600,
      supplierId: 'supp_2',
      invoiceNumber: 'INV-2025-008',
      receivedAt: new Date(now - 12 * 86400000).toISOString(),
      expiryDate: new Date(now + 30 * 86400000).toISOString().split('T')[0],
      batchNumber: 'LOT-20251210',
      barcode: '4820000001241-008',
      processes: [
        {
          documentId: 'proc_8',
          processType: 'cleaning',
          processedAt: new Date(now - 12 * 86400000 + 7200000).toISOString(),
          operatorId: 'user_1',
          operatorName: 'Іван Коваль',
          grossInput: 20.0,
          netOutput: 18.0,
          wasteOutput: 2.0,
          expectedYield: 0.90,
          actualYield: 0.90,
          variancePercent: 0,
        },
      ],
      netAvailable: 0,
      usedAmount: 18.0,
      wastedAmount: 2.0,
      status: 'depleted',
      isLocked: false,
    },
  ];

  return {
    data: batches,
    success: true,
  };
}
