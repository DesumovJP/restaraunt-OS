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

    // Use Strapi's transaction support
    const knex = strapi.db.connection;

    try {
      return await knex.transaction(async (trx) => {
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
          throw { code: 'TICKET_NOT_FOUND', message: 'Kitchen ticket not found' };
        }

        if (ticket.status !== 'queued') {
          throw {
            code: 'INVALID_STATUS',
            message: `Cannot start ticket with status: ${ticket.status}`
          };
        }

        if (ticket.inventoryLocked) {
          throw { code: 'ALREADY_LOCKED', message: 'Inventory already locked for this ticket' };
        }

        const recipe = ticket.orderItem?.menuItem?.recipe;

        // If no recipe or no ingredients, just start the ticket without inventory deduction
        if (!recipe?.ingredients?.length) {
          const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
            documentId: ticketDocumentId,
            data: {
              status: 'started',
              startedAt: new Date().toISOString(),
              assignedChef: chefDocumentId,
              inventoryLocked: true
            }
          });

          // Create event
          await strapi.documents('api::ticket-event.ticket-event').create({
            data: {
              kitchenTicket: ticketDocumentId,
              eventType: 'started',
              previousStatus: 'queued',
              newStatus: 'started',
              actor: chefDocumentId,
              metadata: { noIngredients: true }
            }
          });

          return { success: true, ticket: updatedTicket, inventoryMovements: [], consumedBatches: [] };
        }

        const quantity = ticket.orderItem?.quantity || 1;
        const consumedBatches: BatchConsumption[] = [];
        const inventoryMovements: any[] = [];

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

          let remaining = normalizedGross;

          for (const batch of batches) {
            if (remaining <= 0) break;

            const takeAmount = Math.min(batch.netAvailable, remaining);

            // Update batch in transaction
            await strapi.documents('api::stock-batch.stock-batch').update({
              documentId: batch.documentId,
              data: {
                netAvailable: batch.netAvailable - takeAmount,
                usedAmount: (batch.usedAmount || 0) + takeAmount,
                status: (batch.netAvailable - takeAmount) <= 0.001 ? 'depleted' : batch.status
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
        const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
          documentId: ticketDocumentId,
          data: {
            status: 'started',
            startedAt: new Date().toISOString(),
            assignedChef: chefDocumentId,
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
            actor: chefDocumentId,
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
      });

    } catch (error: any) {
      // Transaction will auto-rollback on error
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
    const movements = await strapi.documents('api::inventory-movement.inventory-movement').findMany({
      filters: {
        kitchenTicket: { documentId: ticketDocumentId },
        movementType: 'recipe_use'
      },
      populate: ['stockBatch', 'ingredient']
    });

    for (const movement of movements) {
      // Restore batch
      if (movement.stockBatch) {
        const batch = await strapi.documents('api::stock-batch.stock-batch').findOne({
          documentId: movement.stockBatch.documentId
        });

        if (batch) {
          await strapi.documents('api::stock-batch.stock-batch').update({
            documentId: movement.stockBatch.documentId,
            data: {
              netAvailable: (batch.netAvailable || 0) + (movement.grossQuantity || movement.quantity),
              usedAmount: Math.max(0, (batch.usedAmount || 0) - (movement.grossQuantity || movement.quantity)),
              status: 'available'
            }
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
              currentStock: (ingredient.currentStock || 0) + (movement.grossQuantity || movement.quantity)
            }
          });
        }
      }

      // Create return movement
      await strapi.documents('api::inventory-movement.inventory-movement').create({
        data: {
          ingredient: movement.ingredient?.documentId,
          stockBatch: movement.stockBatch?.documentId,
          kitchenTicket: ticketDocumentId,
          movementType: 'return',
          quantity: movement.grossQuantity || movement.quantity,
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
  }
});
