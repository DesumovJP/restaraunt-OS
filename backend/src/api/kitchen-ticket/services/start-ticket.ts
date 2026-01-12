/**
 * StartTicket Service
 *
 * Atomic ingredient deduction when chef clicks "Start"
 * - FIFO/FEFO batch selection
 * - Unit normalization (kg<->g, l<->ml)
 * - Waste factor calculation from yield profiles
 * - InventoryMovement creation with reason=recipe_use
 * - inventory_locked flag on ticket
 * - Rollback on insufficient stock
 */

import type { Core } from '@strapi/strapi';

// ============================================
// LOGGING UTILITIES
// ============================================

const LOG_PREFIX = '[Inventory]';

interface InventoryLogContext {
  ticketId?: string;
  ingredientId?: string;
  ingredientName?: string;
  batchId?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  [key: string]: unknown;
}

function logInventory(
  level: 'info' | 'success' | 'error' | 'warn' | 'debug',
  message: string,
  context?: InventoryLogContext
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
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.log(`${LOG_PREFIX} [DEBUG] ${message}`, logData);
      }
      break;
    default:
      console.log(`${LOG_PREFIX} ${message}`, logData);
  }
}

interface StartTicketResult {
  success: boolean;
  ticket?: any;
  inventoryMovements?: any[];
  consumedBatches?: Array<{
    batchDocumentId: string;
    ingredientDocumentId: string;
    grossQuantity: number;
    netQuantity: number;
    cost: number;
  }>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface BatchConsumption {
  batch: any;
  ingredientDocumentId: string;
  grossQuantity: number;
  netQuantity: number;
  cost: number;
}

// Unit conversion factors
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  kg: { g: 1000, kg: 1 },
  g: { kg: 0.001, g: 1 },
  l: { ml: 1000, l: 1 },
  ml: { l: 0.001, ml: 1 },
  pcs: { pcs: 1, portion: 1 },
  portion: { portion: 1, pcs: 1 },
};

function convertUnits(value: number, from: string, to: string): number {
  if (from === to) return value;
  const conversions = UNIT_CONVERSIONS[from];
  if (!conversions || !conversions[to]) {
    throw new Error(`Cannot convert from ${from} to ${to}`);
  }
  return value * conversions[to];
}

function calculateYieldMultiplier(
  yieldProfile: any,
  processChain: string[]
): number {
  if (!yieldProfile) return 1;

  let multiplier = yieldProfile.baseYieldRatio || 1;

  for (const processType of processChain) {
    const processYield = yieldProfile.processYields?.find(
      (p: any) => p.processType === processType
    );
    if (processYield) {
      // Apply moisture loss
      if (processYield.moistureLoss !== undefined) {
        multiplier *= (1 - processYield.moistureLoss);
      }
      // Apply oil absorption (adds weight)
      if (processYield.oilAbsorption !== undefined) {
        multiplier *= (1 + processYield.oilAbsorption);
      }
      // Apply direct yield ratio if specified
      if (processYield.yieldRatio !== undefined) {
        multiplier *= processYield.yieldRatio;
      }
    }
  }

  return multiplier;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({

  async startTicket(
    ticketDocumentId: string,
    chefDocumentId: string
  ): Promise<StartTicketResult> {
    const startTime = Date.now();

    logInventory('info', '→ Starting ticket deduction process', {
      ticketId: ticketDocumentId,
      chefId: chefDocumentId,
    });

    try {
      // 1. Load ticket with relations
      const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
          documentId: ticketDocumentId,
          populate: {
            orderItem: {
              populate: {
                menuItem: {
                  populate: {
                    recipe: {
                      populate: {
                        ingredients: {
                          populate: {
                            ingredient: {
                              populate: ['yieldProfile']
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });

        if (!ticket) {
          logInventory('error', '✗ Ticket not found', { ticketId: ticketDocumentId });
          throw { code: 'TICKET_NOT_FOUND', message: 'Kitchen ticket not found' };
        }

        logInventory('debug', '  Ticket loaded', {
          ticketId: ticketDocumentId,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          menuItem: ticket.orderItem?.menuItem?.name,
        });

        if (ticket.status !== 'queued') {
          logInventory('error', '✗ Invalid ticket status', {
            ticketId: ticketDocumentId,
            currentStatus: ticket.status,
          });
          throw {
            code: 'INVALID_STATUS',
            message: `Cannot start ticket with status: ${ticket.status}`
          };
        }

        if (ticket.inventoryLocked) {
          logInventory('error', '✗ Inventory already locked', { ticketId: ticketDocumentId });
          throw { code: 'ALREADY_LOCKED', message: 'Inventory already locked for this ticket' };
        }

        const recipe = ticket.orderItem?.menuItem?.recipe;

        // If no recipe or no ingredients, just start the ticket without inventory deduction
        if (!recipe?.ingredients?.length) {
          logInventory('info', '  No recipe/ingredients - starting without deduction', {
            ticketId: ticketDocumentId,
          });

          // Only set assignedChef if it's a valid documentId (not 'anonymous')
          const assignedChefValue = chefDocumentId && chefDocumentId !== 'anonymous' ? chefDocumentId : undefined;

          const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
            documentId: ticketDocumentId,
            data: {
              status: 'started',
              startedAt: new Date().toISOString(),
              assignedChef: assignedChefValue,
              inventoryLocked: true
            }
          });

          // Create event (actor can be undefined if anonymous)
          await strapi.documents('api::ticket-event.ticket-event').create({
            data: {
              kitchenTicket: ticketDocumentId,
              eventType: 'started',
              previousStatus: 'queued',
              newStatus: 'started',
              actor: assignedChefValue,
              metadata: { noIngredients: true }
            }
          });

          const duration = Date.now() - startTime;
          logInventory('success', '✓ Ticket started (no inventory)', {
            ticketId: ticketDocumentId,
            duration,
          });

          return { success: true, ticket: updatedTicket, inventoryMovements: [], consumedBatches: [] };
        }

        const quantity = ticket.orderItem?.quantity || 1;
        const consumedBatches: BatchConsumption[] = [];
        const inventoryMovements: any[] = [];

        logInventory('info', `  Processing ${recipe.ingredients.length} ingredients (qty: ${quantity})`, {
          ticketId: ticketDocumentId,
          ingredientCount: recipe.ingredients.length,
          orderQuantity: quantity,
        });

        // 2. Process each ingredient
        for (const recipeIngredient of recipe.ingredients) {
          const ingredient = recipeIngredient.ingredient;
          if (!ingredient) continue;

          const yieldProfile = ingredient.yieldProfile;
          const processChain = (recipeIngredient.processChain as string[]) || ['cleaning'];
          const yieldMultiplier = calculateYieldMultiplier(yieldProfile, processChain);

          // Calculate required NET quantity (what the recipe needs)
          const netRequired = recipeIngredient.quantity * quantity;

          // Calculate required GROSS quantity (before yield loss)
          // gross = net / yieldMultiplier (because netOutput = grossInput * yieldMultiplier)
          const grossRequired = yieldMultiplier > 0 ? netRequired / yieldMultiplier : netRequired;

          // Add waste allowance
          const wasteAllowance = (recipeIngredient.wasteAllowancePercent || 0) / 100;
          const grossWithWaste = grossRequired * (1 + wasteAllowance);

          // Normalize to ingredient's base unit
          const ingredientUnit = ingredient.unit || 'kg';
          const recipeUnit = recipeIngredient.unit || ingredientUnit;

          let normalizedGross: number;
          try {
            normalizedGross = convertUnits(grossWithWaste, recipeUnit, ingredientUnit);
          } catch (e) {
            throw {
              code: 'UNIT_CONVERSION_ERROR',
              message: `Cannot convert ${recipeUnit} to ${ingredientUnit} for ${ingredient.name}`,
              details: { ingredientId: ingredient.documentId }
            };
          }

          // 3. FIFO/FEFO batch selection
          const batches = await strapi.documents('api::stock-batch.stock-batch').findMany({
            filters: {
              ingredient: { documentId: ingredient.documentId },
              status: { $in: ['available', 'received'] },
              netAvailable: { $gt: 0 },
              isLocked: { $ne: true }
            },
            sort: [
              { expiryDate: 'asc' },  // FEFO - First Expiry First Out
              { receivedAt: 'asc' }   // FIFO - First In First Out
            ],
            populate: ['ingredient']
          });

          logInventory('debug', `    Found ${batches.length} available batches`, {
            ingredientId: ingredient.documentId,
            ingredientName: ingredient.name,
            required: normalizedGross,
            unit: ingredientUnit,
            batchCount: batches.length,
          });

          let remaining = normalizedGross;

          for (const batch of batches) {
            if (remaining <= 0) break;

            const takeAmount = Math.min(batch.netAvailable, remaining);
            const newAvailable = batch.netAvailable - takeAmount;
            const isDepleted = newAvailable <= 0.001;

            logInventory('debug', `    Consuming from batch ${batch.batchNumber}`, {
              batchId: batch.documentId,
              batchNumber: batch.batchNumber,
              takeAmount,
              batchAvailable: batch.netAvailable,
              newAvailable,
              isDepleted,
            });

            // Update batch in transaction
            await strapi.documents('api::stock-batch.stock-batch').update({
              documentId: batch.documentId,
              data: {
                netAvailable: newAvailable,
                usedAmount: (batch.usedAmount || 0) + takeAmount,
                status: isDepleted ? 'depleted' : batch.status
              }
            });

            const netQuantity = takeAmount * yieldMultiplier;
            const cost = takeAmount * (batch.unitCost || 0);

            consumedBatches.push({
              batch,
              ingredientDocumentId: ingredient.documentId,
              grossQuantity: takeAmount,
              netQuantity,
              cost
            });

            // Create inventory movement
            const movement = await strapi.documents('api::inventory-movement.inventory-movement').create({
              data: {
                ingredient: ingredient.documentId,
                stockBatch: batch.documentId,
                kitchenTicket: ticketDocumentId,
                movementType: 'recipe_use',
                quantity: takeAmount,
                unit: ingredientUnit,
                grossQuantity: takeAmount,
                netQuantity,
                wasteFactor: 1 - yieldMultiplier,
                unitCost: batch.unitCost || 0,
                totalCost: cost,
                reason: 'recipe_use',
                reasonCode: 'TICKET_START',
                operator: chefDocumentId
              }
            });

            inventoryMovements.push(movement);
            remaining -= takeAmount;
          }

          // 4. Check if sufficient stock
          if (remaining > 0.001) { // Small tolerance for floating point
            logInventory('error', '✗ INSUFFICIENT STOCK', {
              ticketId: ticketDocumentId,
              ingredientId: ingredient.documentId,
              ingredientName: ingredient.name,
              required: normalizedGross,
              available: normalizedGross - remaining,
              shortfall: remaining,
              unit: ingredientUnit,
            });

            throw {
              code: 'INSUFFICIENT_STOCK',
              message: `Insufficient stock for ingredient: ${ingredient.name}`,
              details: {
                ingredientId: ingredient.documentId,
                ingredientName: ingredient.name,
                required: normalizedGross,
                available: normalizedGross - remaining,
                shortfall: remaining,
                unit: ingredientUnit
              }
            };
          }

          logInventory('info', `  ✓ ${ingredient.name}: ${normalizedGross.toFixed(3)} ${ingredientUnit}`, {
            ingredientId: ingredient.documentId,
            ingredientName: ingredient.name,
            consumed: normalizedGross,
            unit: ingredientUnit,
            batchesUsed: consumedBatches.filter(c => c.ingredientDocumentId === ingredient.documentId).length,
          });

          // Update ingredient's current stock
          const totalConsumed = consumedBatches
            .filter(c => c.ingredientDocumentId === ingredient.documentId)
            .reduce((sum, c) => sum + c.grossQuantity, 0);

          await strapi.documents('api::ingredient.ingredient').update({
            documentId: ingredient.documentId,
            data: {
              currentStock: Math.max(0, (ingredient.currentStock || 0) - totalConsumed)
            }
          });
        }

        // 5. Update ticket status
        // Only set assignedChef if it's a valid documentId (not 'anonymous')
        const assignedChefValue = chefDocumentId && chefDocumentId !== 'anonymous' ? chefDocumentId : undefined;

        const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
          documentId: ticketDocumentId,
          data: {
            status: 'started',
            startedAt: new Date().toISOString(),
            assignedChef: assignedChefValue,
            inventoryLocked: true
          }
        });

        // 6. Create ticket event with consumption details
        await strapi.documents('api::ticket-event.ticket-event').create({
          data: {
            kitchenTicket: ticketDocumentId,
            eventType: 'started',
            previousStatus: 'queued',
            newStatus: 'started',
            actor: assignedChefValue,
            metadata: {
              consumedBatches: consumedBatches.map(c => ({
                batchDocumentId: c.batch.documentId,
                ingredientDocumentId: c.ingredientDocumentId,
                grossQuantity: c.grossQuantity,
                netQuantity: c.netQuantity,
                cost: c.cost
              })),
              totalCost: consumedBatches.reduce((sum, c) => sum + c.cost, 0)
            }
          }
        });

        // 7. Update order item status
        if (ticket.orderItem) {
          await strapi.documents('api::order-item.order-item').update({
            documentId: ticket.orderItem.documentId,
            data: {
              status: 'in_progress',
              statusChangedAt: new Date().toISOString(),
              prepStartAt: new Date().toISOString()
            }
          });
        }

        const duration = Date.now() - startTime;
        const totalCost = consumedBatches.reduce((sum, c) => sum + c.cost, 0);

        logInventory('success', '✓ Ticket started with inventory deduction', {
          ticketId: ticketDocumentId,
          ticketNumber: updatedTicket.ticketNumber,
          duration,
          ingredientsProcessed: recipe.ingredients.length,
          batchesConsumed: consumedBatches.length,
          movementsCreated: inventoryMovements.length,
          totalCost: totalCost.toFixed(2),
        });

        // Note: Individual ticket start is NOT logged to action history
        // Inventory consumption is tracked via inventory_movement records
        // All timing data is captured in the table session close log instead

      return {
        success: true,
        ticket: updatedTicket,
        inventoryMovements,
        consumedBatches: consumedBatches.map(c => ({
          batchDocumentId: c.batch.documentId,
          ingredientDocumentId: c.ingredientDocumentId,
          grossQuantity: c.grossQuantity,
          netQuantity: c.netQuantity,
          cost: c.cost
        }))
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logInventory('error', '✗ Start ticket failed', {
        ticketId: ticketDocumentId,
        duration,
        errorCode: error.code,
        errorMessage: error.message,
      });

      return {
        success: false,
        error: {
          code: error.code || 'START_TICKET_FAILED',
          message: error.message || 'Failed to start kitchen ticket',
          details: error.details
        }
      };
    }
  },

  // Release inventory on ticket cancel/fail
  async releaseInventory(ticketDocumentId: string, reason: string, operatorId?: string): Promise<void> {
    const startTime = Date.now();

    logInventory('info', '→ Releasing inventory for ticket', {
      ticketId: ticketDocumentId,
      reason,
    });

    const movements = await strapi.documents('api::inventory-movement.inventory-movement').findMany({
      filters: {
        kitchenTicket: { documentId: ticketDocumentId },
        movementType: 'recipe_use'
      },
      populate: ['stockBatch', 'ingredient']
    });

    logInventory('info', `  Found ${movements.length} movements to reverse`, {
      ticketId: ticketDocumentId,
      movementCount: movements.length,
    });

    let restoredBatches = 0;
    let restoredIngredients = 0;
    let totalQuantityRestored = 0;

    for (const movement of movements) {
      const restoreQty = movement.grossQuantity || movement.quantity;
      totalQuantityRestored += restoreQty;

      // Restore batch
      if (movement.stockBatch) {
        const batch = await strapi.documents('api::stock-batch.stock-batch').findOne({
          documentId: movement.stockBatch.documentId
        });

        if (batch) {
          await strapi.documents('api::stock-batch.stock-batch').update({
            documentId: movement.stockBatch.documentId,
            data: {
              netAvailable: (batch.netAvailable || 0) + restoreQty,
              usedAmount: Math.max(0, (batch.usedAmount || 0) - restoreQty),
              status: 'available'
            }
          });
          restoredBatches++;

          logInventory('debug', `    Restored batch ${batch.batchNumber}`, {
            batchId: batch.documentId,
            restored: restoreQty,
            newAvailable: (batch.netAvailable || 0) + restoreQty,
          });
        }
      }

      // Restore ingredient stock
      if (movement.ingredient) {
        const ingredient = await strapi.documents('api::ingredient.ingredient').findOne({
          documentId: movement.ingredient.documentId
        });

        if (ingredient) {
          await strapi.documents('api::ingredient.ingredient').update({
            documentId: movement.ingredient.documentId,
            data: {
              currentStock: (ingredient.currentStock || 0) + restoreQty
            }
          });
          restoredIngredients++;
        }
      }

      // Create return movement
      await strapi.documents('api::inventory-movement.inventory-movement').create({
        data: {
          ingredient: movement.ingredient?.documentId,
          stockBatch: movement.stockBatch?.documentId,
          kitchenTicket: ticketDocumentId,
          movementType: 'return',
          quantity: restoreQty,
          unit: movement.unit,
          reason,
          reasonCode: 'TICKET_CANCEL',
          notes: `Returned from ticket cancellation`,
          operator: operatorId
        }
      });
    }

    // Update ticket
    await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
      documentId: ticketDocumentId,
      data: {
        inventoryLocked: false
      }
    });

    // Create inventory release event
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: ticketDocumentId,
        eventType: 'inventory_released',
        actor: operatorId,
        reason,
        metadata: {
          releasedMovements: movements.length
        }
      }
    });

    const duration = Date.now() - startTime;
    logInventory('success', '✓ Inventory released', {
      ticketId: ticketDocumentId,
      duration,
      movementsReversed: movements.length,
      batchesRestored: restoredBatches,
      ingredientsRestored: restoredIngredients,
      reason,
    });

    // Note: Inventory release is NOT logged to action history separately
    // The ticket cancel/fail log in the controller includes this information
  }
});
