import { factories } from '@strapi/strapi';
import { logAction } from '../../../utils/action-logger';

const LOG_PREFIX = '[StockBatch]';

function logBatch(
  level: 'info' | 'success' | 'error' | 'warn',
  message: string,
  context?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  const logData = { timestamp, ...context };
  switch (level) {
    case 'error':
      console.error(`${LOG_PREFIX} ${message}`, logData);
      break;
    case 'warn':
      console.warn(`${LOG_PREFIX} ${message}`, logData);
      break;
    default:
      console.log(`${LOG_PREFIX} ${message}`, logData);
  }
}

// Write-off reason mapping
type WriteOffReason =
  | 'expired'
  | 'spoiled'
  | 'damaged'
  | 'contaminated'
  | 'quality_issue'
  | 'overproduction'
  | 'inventory_discrepancy'
  | 'other';

const WRITE_OFF_REASON_UK: Record<WriteOffReason, string> = {
  expired: 'Закінчився термін придатності',
  spoiled: 'Зіпсовано',
  damaged: 'Пошкоджено',
  contaminated: 'Забруднено',
  quality_issue: 'Проблема з якістю',
  overproduction: 'Надлишкове виробництво',
  inventory_discrepancy: 'Інвентаризаційна невідповідність',
  other: 'Інша причина',
};

// Process type mapping
type ProcessType =
  | 'cleaning'
  | 'boiling'
  | 'frying'
  | 'rendering'
  | 'baking'
  | 'grilling'
  | 'portioning';

const PROCESS_TYPE_UK: Record<ProcessType, string> = {
  cleaning: 'Чистка',
  boiling: 'Варіння',
  frying: 'Смаження',
  rendering: 'Топлення',
  baking: 'Випікання',
  grilling: 'Гриль',
  portioning: 'Порціювання',
};

export default factories.createCoreController('api::stock-batch.stock-batch', ({ strapi }) => ({
  /**
   * Receive new batch into inventory
   * POST /api/stock-batches/receive
   */
  async receive(ctx) {
    const {
      ingredientId,
      grossIn,
      unitCost,
      expiryDate,
      supplierId,
      invoiceNumber,
      batchNumber,
      barcode,
    } = ctx.request.body || {};
    const user = ctx.state?.user;

    if (!ingredientId || !grossIn || !unitCost) {
      return ctx.badRequest('ingredientId, grossIn, and unitCost are required');
    }

    logBatch('info', '→ RECEIVE batch requested', {
      ingredientId,
      grossIn,
      unitCost,
      user: user?.username || 'System',
    });

    // Find ingredient with yield profile
    const ingredient = await strapi.documents('api::ingredient.ingredient').findOne({
      documentId: ingredientId,
      populate: ['yieldProfile'],
    });

    if (!ingredient) {
      logBatch('error', '✗ RECEIVE failed: ingredient not found', { ingredientId });
      return ctx.notFound('Ingredient not found');
    }

    // Calculate net available based on yield profile
    const yieldRatio = ingredient.yieldProfile?.baseYieldRatio || 1;
    const netAvailable = parseFloat(grossIn) * yieldRatio;
    const wastedAmount = parseFloat(grossIn) - netAvailable;
    const totalCost = parseFloat(grossIn) * parseFloat(unitCost);

    const now = new Date();
    const nowIso = now.toISOString();

    // Generate batch number if not provided
    const finalBatchNumber = batchNumber || `B${Date.now().toString(36).toUpperCase()}`;

    // Create stock batch
    const batch = await strapi.documents('api::stock-batch.stock-batch').create({
      data: {
        batchNumber: finalBatchNumber,
        barcode: barcode || null,
        ingredient: { documentId: ingredientId },
        grossIn: parseFloat(grossIn),
        netAvailable,
        usedAmount: 0,
        wastedAmount,
        unitCost: parseFloat(unitCost),
        totalCost,
        receivedAt: nowIso,
        expiryDate: expiryDate || null,
        status: 'available',
        supplier: supplierId ? { documentId: supplierId } : null,
        invoiceNumber: invoiceNumber || null,
        processes: [],
      },
    });

    // Update ingredient's current stock
    const newStock = (parseFloat(ingredient.currentStock as any) || 0) + netAvailable;
    await strapi.documents('api::ingredient.ingredient').update({
      documentId: ingredientId,
      data: {
        currentStock: newStock,
      },
    });

    // Create inventory movement record
    await strapi.documents('api::inventory-movement.inventory-movement').create({
      data: {
        ingredient: { documentId: ingredientId },
        stockBatch: { documentId: batch.documentId },
        movementType: 'receive',
        quantity: netAvailable,
        grossQuantity: parseFloat(grossIn),
        netQuantity: netAvailable,
        wasteFactor: yieldRatio,
        unitCost: parseFloat(unitCost),
        totalCost,
        unit: ingredient.unit,
        reason: 'Отримання нової партії',
        operator: user?.documentId ? { documentId: user.documentId } : null,
      },
    });

    logBatch('success', '✓ RECEIVE completed', {
      batchId: batch.documentId,
      batchNumber: finalBatchNumber,
      ingredient: ingredient.name,
      grossIn,
      netAvailable,
      yieldRatio,
    });

    // Log action
    await logAction(strapi, {
      action: 'receive',
      entityType: 'stock_batch',
      entityId: batch.documentId,
      entityName: `${ingredient.nameUk || ingredient.name} (${finalBatchNumber})`,
      description: `Batch received: ${ingredient.name} - ${grossIn} ${ingredient.unit}`,
      descriptionUk: `📦 Отримано партію: ${ingredient.nameUk || ingredient.name} - ${grossIn} ${ingredient.unit} (чистий вихід: ${netAvailable.toFixed(2)} ${ingredient.unit})`,
      dataAfter: {
        batchNumber: finalBatchNumber,
        grossIn,
        netAvailable,
        unitCost,
        totalCost,
        expiryDate,
      },
      metadata: {
        ingredientId,
        ingredientName: ingredient.nameUk || ingredient.name,
        supplierId,
        invoiceNumber,
        yieldRatio,
        previousStock: ingredient.currentStock,
        newStock,
      },
      module: 'storage',
      severity: 'info',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      batch,
      ingredient: {
        documentId: ingredientId,
        name: ingredient.name,
        currentStock: newStock,
      },
    });
  },

  /**
   * Consume from batches using FIFO
   * POST /api/stock-batches/consume
   */
  async consume(ctx) {
    const {
      ingredientId,
      quantity,
      kitchenTicketId,
      reason,
      notes,
    } = ctx.request.body || {};
    const user = ctx.state?.user;

    if (!ingredientId || !quantity) {
      return ctx.badRequest('ingredientId and quantity are required');
    }

    const consumeQty = parseFloat(quantity);
    if (consumeQty <= 0) {
      return ctx.badRequest('quantity must be positive');
    }

    logBatch('info', '→ CONSUME (FIFO) requested', {
      ingredientId,
      quantity: consumeQty,
      kitchenTicketId,
      user: user?.username || 'System',
    });

    // Find ingredient
    const ingredient = await strapi.documents('api::ingredient.ingredient').findOne({
      documentId: ingredientId,
    });

    if (!ingredient) {
      logBatch('error', '✗ CONSUME failed: ingredient not found', { ingredientId });
      return ctx.notFound('Ingredient not found');
    }

    // Find available batches sorted by receivedAt (FIFO)
    const availableBatches = await strapi.documents('api::stock-batch.stock-batch').findMany({
      filters: {
        ingredient: { documentId: ingredientId },
        status: 'available',
        isLocked: false,
      },
      sort: { receivedAt: 'asc' },
    });

    // Calculate total available
    const totalAvailable = availableBatches.reduce(
      (sum, batch) => sum + (parseFloat(batch.netAvailable as any) || 0),
      0
    );

    if (totalAvailable < consumeQty) {
      logBatch('warn', '⚠ CONSUME: insufficient stock', {
        ingredientId,
        requested: consumeQty,
        available: totalAvailable,
      });
      return ctx.badRequest(
        `Недостатньо запасів. Запитано: ${consumeQty} ${ingredient.unit}, доступно: ${totalAvailable.toFixed(2)} ${ingredient.unit}`
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();
    let remainingQty = consumeQty;
    const consumedBatches: Array<{
      batchId: string;
      batchNumber: string;
      consumed: number;
      remaining: number;
      depleted: boolean;
    }> = [];
    let totalCost = 0;

    // Consume from batches in FIFO order
    for (const batch of availableBatches) {
      if (remainingQty <= 0) break;

      const batchAvailable = parseFloat(batch.netAvailable as any) || 0;
      const consumeFromBatch = Math.min(remainingQty, batchAvailable);
      const newAvailable = batchAvailable - consumeFromBatch;
      const newUsed = (parseFloat(batch.usedAmount as any) || 0) + consumeFromBatch;
      const batchCost = consumeFromBatch * (parseFloat(batch.unitCost as any) || 0);
      totalCost += batchCost;

      const isDepleted = newAvailable <= 0.001; // Small threshold for floating point

      // Update batch
      await strapi.documents('api::stock-batch.stock-batch').update({
        documentId: batch.documentId,
        data: {
          netAvailable: isDepleted ? 0 : newAvailable,
          usedAmount: newUsed,
          status: isDepleted ? 'depleted' : 'available',
        },
      });

      // Create movement record
      await strapi.documents('api::inventory-movement.inventory-movement').create({
        data: {
          ingredient: { documentId: ingredientId },
          stockBatch: { documentId: batch.documentId },
          kitchenTicket: kitchenTicketId ? { documentId: kitchenTicketId } : null,
          movementType: 'recipe_use',
          quantity: -consumeFromBatch,
          unit: ingredient.unit,
          unitCost: parseFloat(batch.unitCost as any) || 0,
          totalCost: batchCost,
          reason: reason || 'Використання за рецептом',
          notes,
          operator: user?.documentId ? { documentId: user.documentId } : null,
        },
      });

      consumedBatches.push({
        batchId: batch.documentId,
        batchNumber: batch.batchNumber,
        consumed: consumeFromBatch,
        remaining: isDepleted ? 0 : newAvailable,
        depleted: isDepleted,
      });

      remainingQty -= consumeFromBatch;
    }

    // Update ingredient's current stock
    const previousStock = parseFloat(ingredient.currentStock as any) || 0;
    const newStock = previousStock - consumeQty;
    await strapi.documents('api::ingredient.ingredient').update({
      documentId: ingredientId,
      data: {
        currentStock: Math.max(0, newStock),
      },
    });

    logBatch('success', '✓ CONSUME completed (FIFO)', {
      ingredientId,
      consumed: consumeQty,
      batchesAffected: consumedBatches.length,
      depletedBatches: consumedBatches.filter((b) => b.depleted).length,
      totalCost,
    });

    // Log action
    await logAction(strapi, {
      action: 'update',
      entityType: 'ingredient',
      entityId: ingredientId,
      entityName: ingredient.nameUk || ingredient.name,
      description: `FIFO consumption: ${ingredient.name} - ${consumeQty} ${ingredient.unit}`,
      descriptionUk: `📤 Списання (FIFO): ${ingredient.nameUk || ingredient.name} - ${consumeQty} ${ingredient.unit} (${consumedBatches.length} партій)`,
      dataBefore: { currentStock: previousStock },
      dataAfter: { currentStock: newStock },
      metadata: {
        consumedQuantity: consumeQty,
        totalCost,
        batchesAffected: consumedBatches.length,
        consumedBatches,
        kitchenTicketId,
        reason,
      },
      module: 'storage',
      severity: 'info',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      consumed: consumeQty,
      totalCost,
      batchesAffected: consumedBatches,
      ingredient: {
        documentId: ingredientId,
        name: ingredient.name,
        previousStock,
        currentStock: newStock,
      },
    });
  },

  /**
   * Process batch (cleaning, boiling, etc.) - reduces net available based on yield
   * POST /api/stock-batches/:documentId/process
   */
  async process(ctx) {
    const { documentId } = ctx.params;
    const { processType, yieldRatio, notes } = ctx.request.body || {};
    const user = ctx.state?.user;

    if (!processType) {
      return ctx.badRequest('processType is required');
    }

    logBatch('info', '→ PROCESS batch requested', {
      batchId: documentId,
      processType,
      yieldRatio,
      user: user?.username || 'System',
    });

    // Find batch with ingredient
    const batch = await strapi.documents('api::stock-batch.stock-batch').findOne({
      documentId,
      populate: ['ingredient'],
    });

    if (!batch) {
      logBatch('error', '✗ PROCESS failed: batch not found', { batchId: documentId });
      return ctx.notFound('Batch not found');
    }

    if (batch.isLocked) {
      return ctx.badRequest('Партія заблокована іншим процесом');
    }

    if (!['available', 'processing'].includes(batch.status)) {
      return ctx.badRequest(
        `Неможливо обробити партію зі статусом "${batch.status}"`
      );
    }

    const currentNet = parseFloat(batch.netAvailable as any) || 0;
    if (currentNet <= 0) {
      return ctx.badRequest('Партія порожня');
    }

    // Get yield ratio from ingredient's yield profile or use provided
    let effectiveYield = parseFloat(yieldRatio) || 0.9;
    if (!yieldRatio && batch.ingredient?.yieldProfile) {
      // Check if yield profile has process-specific yield
      const yieldProfile = await strapi.documents('api::yield-profile.yield-profile').findOne({
        documentId: batch.ingredient.yieldProfile.documentId,
      });

      if (yieldProfile?.processYields) {
        const processYields = yieldProfile.processYields as Array<{
          processType: string;
          yieldRatio: number;
        }>;
        const processYield = processYields.find((p) => p.processType === processType);
        if (processYield) {
          effectiveYield = processYield.yieldRatio;
        }
      }
    }

    const newNetAvailable = currentNet * effectiveYield;
    const wasteFromProcess = currentNet - newNetAvailable;
    const previousWaste = parseFloat(batch.wastedAmount as any) || 0;
    const newWastedAmount = previousWaste + wasteFromProcess;

    const now = new Date();
    const nowIso = now.toISOString();

    // Add process to history
    const processes = (batch.processes as any[]) || [];
    processes.push({
      type: processType,
      yieldRatio: effectiveYield,
      inputAmount: currentNet,
      outputAmount: newNetAvailable,
      wasteAmount: wasteFromProcess,
      processedAt: nowIso,
      processedBy: user?.username || 'System',
      notes,
    });

    // Update batch
    const updatedBatch = await strapi.documents('api::stock-batch.stock-batch').update({
      documentId,
      data: {
        netAvailable: newNetAvailable,
        wastedAmount: newWastedAmount,
        status: 'available',
        processes,
      },
    });

    // Update ingredient's current stock
    const ingredient = batch.ingredient;
    if (ingredient) {
      const ingredientStock = parseFloat(ingredient.currentStock as any) || 0;
      const newIngredientStock = ingredientStock - wasteFromProcess;
      await strapi.documents('api::ingredient.ingredient').update({
        documentId: ingredient.documentId,
        data: {
          currentStock: Math.max(0, newIngredientStock),
        },
      });
    }

    // Create movement record for waste
    await strapi.documents('api::inventory-movement.inventory-movement').create({
      data: {
        ingredient: ingredient ? { documentId: ingredient.documentId } : null,
        stockBatch: { documentId },
        movementType: 'process',
        quantity: -wasteFromProcess,
        unit: ingredient?.unit || 'kg',
        wasteFactor: effectiveYield,
        reason: `Обробка: ${PROCESS_TYPE_UK[processType as ProcessType] || processType}`,
        notes,
        operator: user?.documentId ? { documentId: user.documentId } : null,
      },
    });

    logBatch('success', '✓ PROCESS completed', {
      batchId: documentId,
      processType,
      effectiveYield,
      inputAmount: currentNet,
      outputAmount: newNetAvailable,
      wasteAmount: wasteFromProcess,
    });

    // Log action
    await logAction(strapi, {
      action: 'update',
      entityType: 'stock_batch',
      entityId: documentId,
      entityName: `${ingredient?.nameUk || ingredient?.name || 'Партія'} (${batch.batchNumber})`,
      description: `Batch processed: ${processType}`,
      descriptionUk: `🔄 Обробка партії: ${PROCESS_TYPE_UK[processType as ProcessType] || processType} (вихід: ${(effectiveYield * 100).toFixed(0)}%)`,
      dataBefore: {
        netAvailable: currentNet,
        wastedAmount: previousWaste,
      },
      dataAfter: {
        netAvailable: newNetAvailable,
        wastedAmount: newWastedAmount,
      },
      metadata: {
        processType,
        processTypeUk: PROCESS_TYPE_UK[processType as ProcessType],
        yieldRatio: effectiveYield,
        inputAmount: currentNet,
        outputAmount: newNetAvailable,
        wasteAmount: wasteFromProcess,
        processHistory: processes,
      },
      module: 'storage',
      severity: 'info',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      batch: updatedBatch,
      processing: {
        type: processType,
        typeUk: PROCESS_TYPE_UK[processType as ProcessType],
        yieldRatio: effectiveYield,
        inputAmount: currentNet,
        outputAmount: newNetAvailable,
        wasteAmount: wasteFromProcess,
      },
    });
  },

  /**
   * Write-off batch
   * POST /api/stock-batches/:documentId/write-off
   */
  async writeOff(ctx) {
    const { documentId } = ctx.params;
    const { reason, quantity, notes } = ctx.request.body || {};
    const user = ctx.state?.user;

    if (!reason) {
      return ctx.badRequest('reason is required');
    }

    logBatch('warn', '→ WRITE-OFF batch requested', {
      batchId: documentId,
      reason,
      quantity,
      user: user?.username || 'System',
    });

    // Find batch with ingredient
    const batch = await strapi.documents('api::stock-batch.stock-batch').findOne({
      documentId,
      populate: ['ingredient'],
    });

    if (!batch) {
      logBatch('error', '✗ WRITE-OFF failed: batch not found', { batchId: documentId });
      return ctx.notFound('Batch not found');
    }

    if (batch.status === 'written_off') {
      return ctx.badRequest('Партія вже списана');
    }

    if (batch.isLocked) {
      return ctx.badRequest('Партія заблокована іншим процесом');
    }

    const currentNet = parseFloat(batch.netAvailable as any) || 0;
    const writeOffQty = quantity ? Math.min(parseFloat(quantity), currentNet) : currentNet;
    const isFullWriteOff = writeOffQty >= currentNet - 0.001;

    const now = new Date();
    const nowIso = now.toISOString();

    const previousWaste = parseFloat(batch.wastedAmount as any) || 0;
    const newWastedAmount = previousWaste + writeOffQty;
    const newNetAvailable = isFullWriteOff ? 0 : currentNet - writeOffQty;

    // Calculate cost of write-off
    const unitCost = parseFloat(batch.unitCost as any) || 0;
    const writeOffCost = writeOffQty * unitCost;

    // Update batch
    const updatedBatch = await strapi.documents('api::stock-batch.stock-batch').update({
      documentId,
      data: {
        netAvailable: newNetAvailable,
        wastedAmount: newWastedAmount,
        status: isFullWriteOff ? 'written_off' : batch.status,
      },
    });

    // Update ingredient's current stock
    const ingredient = batch.ingredient;
    if (ingredient) {
      const ingredientStock = parseFloat(ingredient.currentStock as any) || 0;
      const newIngredientStock = ingredientStock - writeOffQty;
      await strapi.documents('api::ingredient.ingredient').update({
        documentId: ingredient.documentId,
        data: {
          currentStock: Math.max(0, newIngredientStock),
        },
      });
    }

    // Create movement record
    await strapi.documents('api::inventory-movement.inventory-movement').create({
      data: {
        ingredient: ingredient ? { documentId: ingredient.documentId } : null,
        stockBatch: { documentId },
        movementType: 'write_off',
        quantity: -writeOffQty,
        unit: ingredient?.unit || 'kg',
        unitCost,
        totalCost: writeOffCost,
        reason: WRITE_OFF_REASON_UK[reason as WriteOffReason] || reason,
        reasonCode: reason,
        notes,
        operator: user?.documentId ? { documentId: user.documentId } : null,
      },
    });

    logBatch('warn', '⚠ WRITE-OFF completed', {
      batchId: documentId,
      batchNumber: batch.batchNumber,
      writtenOff: writeOffQty,
      writeOffCost,
      fullyWrittenOff: isFullWriteOff,
    });

    // Log action with warning severity
    await logAction(strapi, {
      action: 'write_off',
      entityType: 'stock_batch',
      entityId: documentId,
      entityName: `${ingredient?.nameUk || ingredient?.name || 'Партія'} (${batch.batchNumber})`,
      description: `Batch write-off: ${reason} - ${writeOffQty} ${ingredient?.unit || 'units'}`,
      descriptionUk: `⚠️ Списання: ${ingredient?.nameUk || ingredient?.name} - ${writeOffQty.toFixed(2)} ${ingredient?.unit || ''} (${WRITE_OFF_REASON_UK[reason as WriteOffReason] || reason})`,
      dataBefore: {
        netAvailable: currentNet,
        status: batch.status,
      },
      dataAfter: {
        netAvailable: newNetAvailable,
        status: isFullWriteOff ? 'written_off' : batch.status,
      },
      metadata: {
        reason,
        reasonUk: WRITE_OFF_REASON_UK[reason as WriteOffReason],
        quantity: writeOffQty,
        writeOffCost,
        fullWriteOff: isFullWriteOff,
        batchNumber: batch.batchNumber,
        ingredientId: ingredient?.documentId,
        notes,
      },
      module: 'storage',
      severity: 'warning',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      batch: updatedBatch,
      writeOff: {
        quantity: writeOffQty,
        cost: writeOffCost,
        reason,
        reasonUk: WRITE_OFF_REASON_UK[reason as WriteOffReason],
        fullWriteOff: isFullWriteOff,
      },
    });
  },

  /**
   * Lock batch for concurrent access control
   * POST /api/stock-batches/:documentId/lock
   */
  async lock(ctx) {
    const { documentId } = ctx.params;
    const { lockReason } = ctx.request.body || {};
    const user = ctx.state?.user;

    logBatch('info', '→ LOCK batch requested', {
      batchId: documentId,
      user: user?.username || 'System',
    });

    // Find batch
    const batch = await strapi.documents('api::stock-batch.stock-batch').findOne({
      documentId,
    });

    if (!batch) {
      return ctx.notFound('Batch not found');
    }

    if (batch.isLocked) {
      return ctx.badRequest(
        `Партія вже заблокована користувачем ${batch.lockedBy}`
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const lockedBy = user?.username || 'System';

    // Update batch
    const updatedBatch = await strapi.documents('api::stock-batch.stock-batch').update({
      documentId,
      data: {
        isLocked: true,
        lockedBy,
        lockedAt: nowIso,
      },
    });

    logBatch('success', '✓ LOCK completed', {
      batchId: documentId,
      lockedBy,
    });

    return ctx.send({
      success: true,
      batch: updatedBatch,
    });
  },

  /**
   * Unlock batch
   * DELETE /api/stock-batches/:documentId/lock
   */
  async unlock(ctx) {
    const { documentId } = ctx.params;
    const { force } = ctx.query;
    const user = ctx.state?.user;

    logBatch('info', '→ UNLOCK batch requested', {
      batchId: documentId,
      force,
      user: user?.username || 'System',
    });

    // Find batch
    const batch = await strapi.documents('api::stock-batch.stock-batch').findOne({
      documentId,
    });

    if (!batch) {
      return ctx.notFound('Batch not found');
    }

    if (!batch.isLocked) {
      return ctx.badRequest('Партія не заблокована');
    }

    // Check if user can unlock
    const currentUser = user?.username || 'System';
    if (batch.lockedBy !== currentUser && !force) {
      return ctx.forbidden(
        `Партія заблокована користувачем ${batch.lockedBy}. Використовуйте force=true для примусового розблокування.`
      );
    }

    // Update batch
    const updatedBatch = await strapi.documents('api::stock-batch.stock-batch').update({
      documentId,
      data: {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      },
    });

    logBatch('success', '✓ UNLOCK completed', {
      batchId: documentId,
      previouslyLockedBy: batch.lockedBy,
    });

    return ctx.send({
      success: true,
      batch: updatedBatch,
    });
  },

  /**
   * Physical inventory count reconciliation
   * POST /api/stock-batches/:documentId/count
   */
  async inventoryCount(ctx) {
    const { documentId } = ctx.params;
    const { actualQuantity, notes } = ctx.request.body || {};
    const user = ctx.state?.user;

    if (actualQuantity === undefined || actualQuantity === null) {
      return ctx.badRequest('actualQuantity is required');
    }

    const actualQty = parseFloat(actualQuantity);
    if (actualQty < 0) {
      return ctx.badRequest('actualQuantity cannot be negative');
    }

    logBatch('info', '→ INVENTORY COUNT requested', {
      batchId: documentId,
      actualQuantity: actualQty,
      user: user?.username || 'System',
    });

    // Find batch with ingredient
    const batch = await strapi.documents('api::stock-batch.stock-batch').findOne({
      documentId,
      populate: ['ingredient'],
    });

    if (!batch) {
      logBatch('error', '✗ INVENTORY COUNT failed: batch not found', { batchId: documentId });
      return ctx.notFound('Batch not found');
    }

    if (batch.isLocked) {
      return ctx.badRequest('Партія заблокована іншим процесом');
    }

    const systemQuantity = parseFloat(batch.netAvailable as any) || 0;
    const discrepancy = actualQty - systemQuantity;

    const now = new Date();
    const nowIso = now.toISOString();

    // Update batch with actual quantity
    let newStatus = batch.status;
    if (actualQty <= 0.001) {
      newStatus = 'depleted';
    }

    const updatedBatch = await strapi.documents('api::stock-batch.stock-batch').update({
      documentId,
      data: {
        netAvailable: actualQty,
        status: newStatus,
      },
    });

    // Update ingredient's current stock with the discrepancy
    const ingredient = batch.ingredient;
    if (ingredient && Math.abs(discrepancy) > 0.001) {
      const ingredientStock = parseFloat(ingredient.currentStock as any) || 0;
      const newIngredientStock = ingredientStock + discrepancy;
      await strapi.documents('api::ingredient.ingredient').update({
        documentId: ingredient.documentId,
        data: {
          currentStock: Math.max(0, newIngredientStock),
        },
      });

      // Create adjustment movement
      await strapi.documents('api::inventory-movement.inventory-movement').create({
        data: {
          ingredient: { documentId: ingredient.documentId },
          stockBatch: { documentId },
          movementType: 'adjust',
          quantity: discrepancy,
          unit: ingredient.unit,
          reason: discrepancy > 0
            ? 'Інвентаризація: виявлено надлишок'
            : 'Інвентаризація: виявлено недостачу',
          notes: notes || `Системне: ${systemQuantity.toFixed(2)}, Фактичне: ${actualQty.toFixed(2)}`,
          operator: user?.documentId ? { documentId: user.documentId } : null,
        },
      });
    }

    const severity = Math.abs(discrepancy) > systemQuantity * 0.1 ? 'warning' : 'info';

    logBatch(
      Math.abs(discrepancy) > 0.001 ? 'warn' : 'success',
      `✓ INVENTORY COUNT completed${Math.abs(discrepancy) > 0.001 ? ' with discrepancy' : ''}`,
      {
        batchId: documentId,
        systemQuantity,
        actualQuantity: actualQty,
        discrepancy,
      }
    );

    // Log action
    await logAction(strapi, {
      action: 'update',
      entityType: 'stock_batch',
      entityId: documentId,
      entityName: `${ingredient?.nameUk || ingredient?.name || 'Партія'} (${batch.batchNumber})`,
      description: `Inventory count: ${batch.batchNumber}`,
      descriptionUk: discrepancy > 0.001
        ? `📊 Інвентаризація: ${ingredient?.nameUk || ingredient?.name} - надлишок +${discrepancy.toFixed(2)} ${ingredient?.unit || ''}`
        : discrepancy < -0.001
          ? `📊 Інвентаризація: ${ingredient?.nameUk || ingredient?.name} - недостача ${discrepancy.toFixed(2)} ${ingredient?.unit || ''}`
          : `📊 Інвентаризація: ${ingredient?.nameUk || ingredient?.name} - без розбіжностей`,
      dataBefore: { netAvailable: systemQuantity },
      dataAfter: { netAvailable: actualQty },
      metadata: {
        systemQuantity,
        actualQuantity: actualQty,
        discrepancy,
        discrepancyPercent: systemQuantity > 0 ? (discrepancy / systemQuantity) * 100 : 0,
        batchNumber: batch.batchNumber,
        ingredientId: ingredient?.documentId,
        notes,
      },
      module: 'storage',
      severity,
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      batch: updatedBatch,
      reconciliation: {
        systemQuantity,
        actualQuantity: actualQty,
        discrepancy,
        discrepancyPercent: systemQuantity > 0 ? (discrepancy / systemQuantity) * 100 : 0,
        hasDiscrepancy: Math.abs(discrepancy) > 0.001,
      },
    });
  },

  /**
   * Get batches expiring soon
   * GET /api/stock-batches/expiring
   */
  async expiringSoon(ctx) {
    const { days = 7 } = ctx.query;
    const daysNum = parseInt(days as string, 10) || 7;

    logBatch('info', '→ GET expiring batches', { days: daysNum });

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysNum);

    const expiringBatches = await strapi.documents('api::stock-batch.stock-batch').findMany({
      filters: {
        status: { $in: ['available', 'reserved'] },
        expiryDate: {
          $gte: now.toISOString().split('T')[0],
          $lte: futureDate.toISOString().split('T')[0],
        },
      },
      populate: ['ingredient', 'supplier'],
      sort: { expiryDate: 'asc' },
    });

    // Check for already expired batches
    const expiredBatches = await strapi.documents('api::stock-batch.stock-batch').findMany({
      filters: {
        status: { $in: ['available', 'reserved'] },
        expiryDate: { $lt: now.toISOString().split('T')[0] },
      },
      populate: ['ingredient'],
    });

    // Auto-update expired batches status
    for (const batch of expiredBatches) {
      await strapi.documents('api::stock-batch.stock-batch').update({
        documentId: batch.documentId,
        data: { status: 'expired' },
      });
    }

    logBatch('success', '✓ GET expiring batches completed', {
      expiringSoon: expiringBatches.length,
      alreadyExpired: expiredBatches.length,
    });

    return ctx.send({
      success: true,
      expiringSoon: expiringBatches.map((b) => ({
        documentId: b.documentId,
        batchNumber: b.batchNumber,
        ingredient: b.ingredient?.name,
        ingredientUk: b.ingredient?.nameUk,
        netAvailable: b.netAvailable,
        unit: b.ingredient?.unit,
        expiryDate: b.expiryDate,
        daysUntilExpiry: Math.ceil(
          (new Date(b.expiryDate as string).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
        supplier: b.supplier?.name,
      })),
      alreadyExpired: expiredBatches.map((b) => ({
        documentId: b.documentId,
        batchNumber: b.batchNumber,
        ingredient: b.ingredient?.name,
        ingredientUk: b.ingredient?.nameUk,
        netAvailable: b.netAvailable,
        unit: b.ingredient?.unit,
        expiryDate: b.expiryDate,
      })),
      summary: {
        expiringSoonCount: expiringBatches.length,
        alreadyExpiredCount: expiredBatches.length,
        totalAtRisk: expiringBatches.length + expiredBatches.length,
      },
    });
  },

  /**
   * Get low stock ingredients
   * GET /api/stock-batches/low-stock
   */
  async lowStock(ctx) {
    logBatch('info', '→ GET low stock ingredients');

    const ingredients = await strapi.documents('api::ingredient.ingredient').findMany({
      filters: {
        isActive: true,
      },
    });

    const lowStockItems = ingredients.filter((ing) => {
      const current = parseFloat(ing.currentStock as any) || 0;
      const min = parseFloat(ing.minStock as any) || 0;
      return current <= min && min > 0;
    });

    const criticalItems = lowStockItems.filter((ing) => {
      const current = parseFloat(ing.currentStock as any) || 0;
      const min = parseFloat(ing.minStock as any) || 0;
      return current <= min * 0.5;
    });

    logBatch('success', '✓ GET low stock completed', {
      lowStock: lowStockItems.length,
      critical: criticalItems.length,
    });

    return ctx.send({
      success: true,
      lowStock: lowStockItems.map((ing) => ({
        documentId: ing.documentId,
        name: ing.name,
        nameUk: ing.nameUk,
        currentStock: ing.currentStock,
        minStock: ing.minStock,
        unit: ing.unit,
        shortage: (parseFloat(ing.minStock as any) || 0) - (parseFloat(ing.currentStock as any) || 0),
        isCritical:
          (parseFloat(ing.currentStock as any) || 0) <=
          (parseFloat(ing.minStock as any) || 0) * 0.5,
      })),
      summary: {
        lowStockCount: lowStockItems.length,
        criticalCount: criticalItems.length,
      },
    });
  },
}));
