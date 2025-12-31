/**
 * Bill of Materials (BOM) Integration
 *
 * Recipe-based inventory consumption with:
 * - FIFO batch consumption
 * - Yield-adjusted quantities
 * - Cost tracking
 * - Variance alerts
 * - Substitution policies
 */

import type {
  YieldProfile,
  StorageBatch,
  ProcessType,
  ExtendedWriteOffReason,
} from '@/types/extended';

// ==========================================
// BOM TYPES
// ==========================================

export interface BOMIngredient {
  productDocumentId: string;
  productSlug: string;
  productName: string;
  requiredQuantity: number;     // Quantity needed per portion
  unit: string;
  yieldProfileId?: string;
  processChain: ProcessType[];  // Processes applied (e.g., ['cleaning', 'grilling'])
  substitutes?: SubstituteIngredient[];
  isOptional: boolean;
  wasteAllowancePercent: number; // Acceptable waste %
}

export interface SubstituteIngredient {
  productDocumentId: string;
  productSlug: string;
  productName: string;
  conversionRatio: number;      // How much substitute per original
  priority: number;             // Lower = preferred
  costMultiplier: number;
}

export interface BOM {
  documentId: string;
  slug: string;
  menuItemDocumentId: string;
  menuItemSlug: string;
  menuItemName: string;
  portionYield: number;         // Number of portions this BOM makes
  ingredients: BOMIngredient[];
  preparationSteps: PreparationStep[];
  totalCostPerPortion: number;
  lastCalculatedAt: string;
}

export interface PreparationStep {
  stepNumber: number;
  description: string;
  station: string;
  estimatedTimeMs: number;
  ingredients: string[];        // productDocumentIds used in this step
  processType?: ProcessType;
  yieldExpected?: number;
}

// ==========================================
// CONSUMPTION CALCULATION
// ==========================================

export interface ConsumptionRequest {
  bomDocumentId: string;
  portions: number;
  orderDocumentId: string;
  orderItemDocumentId: string;
}

export interface ConsumptionResult {
  success: boolean;
  consumedBatches: ConsumedBatch[];
  totalCost: number;
  costPerPortion: number;
  substitutions: SubstitutionUsed[];
  variances: VarianceRecord[];
  errors: ConsumptionError[];
}

export interface ConsumedBatch {
  batchDocumentId: string;
  batchSlug: string;
  productDocumentId: string;
  productName: string;
  quantity: number;             // Gross quantity consumed
  netQuantity: number;          // After yield adjustment
  unitCost: number;
  totalCost: number;
  expiryDate?: string;
  batchNumber?: string;
}

export interface SubstitutionUsed {
  originalProductId: string;
  originalProductName: string;
  substituteProductId: string;
  substituteProductName: string;
  quantity: number;
  reason: 'insufficient_stock' | 'expired' | 'quality_issue' | 'cost_optimization';
  costDifference: number;
}

export interface VarianceRecord {
  productDocumentId: string;
  productName: string;
  expectedQuantity: number;
  actualQuantity: number;
  varianceQuantity: number;
  variancePercent: number;
  withinTolerance: boolean;
  processType?: ProcessType;
}

export interface ConsumptionError {
  code: string;
  message: string;
  productDocumentId?: string;
  productName?: string;
  requiredQuantity?: number;
  availableQuantity?: number;
}

// ==========================================
// FIFO CONSUMPTION ENGINE
// ==========================================

export interface FIFOConsumptionParams {
  productDocumentId: string;
  requiredQuantity: number;     // Net quantity needed
  yieldProfile?: YieldProfile;
  processChain: ProcessType[];
  availableBatches: StorageBatch[];
  orderContext: {
    orderDocumentId: string;
    orderItemDocumentId: string;
  };
}

export interface FIFOResult {
  success: boolean;
  consumedBatches: Array<{
    batch: StorageBatch;
    grossQuantity: number;
    netQuantity: number;
    cost: number;
  }>;
  totalGross: number;
  totalNet: number;
  totalCost: number;
  remainingRequired: number;
  insufficientStock: boolean;
}

export function consumeFIFO(params: FIFOConsumptionParams): FIFOResult {
  const {
    requiredQuantity,
    yieldProfile,
    processChain,
    availableBatches,
  } = params;

  // Calculate gross quantity needed based on yield chain
  const totalYieldRatio = calculateChainedYieldRatio(yieldProfile, processChain);
  const grossRequired = requiredQuantity / totalYieldRatio;

  // Sort batches by FIFO (oldest first)
  const sortedBatches = [...availableBatches].sort((a, b) => {
    // First by expiry date (if exists)
    if (a.expiryDate && b.expiryDate) {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    // Then by received date
    return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
  });

  const consumedBatches: FIFOResult['consumedBatches'] = [];
  let remainingRequired = grossRequired;
  let totalGross = 0;
  let totalNet = 0;
  let totalCost = 0;

  for (const batch of sortedBatches) {
    if (remainingRequired <= 0) break;

    // Skip unavailable batches
    if (batch.status !== 'available' || batch.netAvailable <= 0) continue;

    // Calculate how much to take from this batch
    const takeGross = Math.min(batch.netAvailable, remainingRequired);
    const takeNet = takeGross * totalYieldRatio;
    const takeCost = takeGross * batch.unitCost;

    consumedBatches.push({
      batch,
      grossQuantity: takeGross,
      netQuantity: takeNet,
      cost: takeCost,
    });

    remainingRequired -= takeGross;
    totalGross += takeGross;
    totalNet += takeNet;
    totalCost += takeCost;
  }

  return {
    success: remainingRequired <= 0,
    consumedBatches,
    totalGross,
    totalNet,
    totalCost,
    remainingRequired: Math.max(0, remainingRequired),
    insufficientStock: remainingRequired > 0,
  };
}

function calculateChainedYieldRatio(
  profile: YieldProfile | undefined,
  processChain: ProcessType[]
): number {
  if (!profile) return 1;

  let totalYield = profile.baseYieldRatio;

  for (const processType of processChain) {
    const processYield = profile.processYields.find((p) => p.processType === processType);
    if (processYield) {
      // Apply process-specific yield
      if (processYield.moistureLoss !== undefined) {
        totalYield *= 1 - processYield.moistureLoss;
      }
      if (processYield.oilAbsorption !== undefined) {
        totalYield *= 1 + processYield.oilAbsorption;
      }
    }
  }

  return totalYield;
}

// ==========================================
// SUBSTITUTION ENGINE
// ==========================================

export interface SubstitutionParams {
  originalProduct: {
    documentId: string;
    name: string;
    requiredQuantity: number;
  };
  substitutes: SubstituteIngredient[];
  availableBatches: Map<string, StorageBatch[]>; // productId -> batches
  policy: SubstitutionPolicy;
}

export type SubstitutionPolicy =
  | 'never'           // Never substitute
  | 'same_cost'       // Only if same or lower cost
  | 'any'             // Any available substitute
  | 'ask_manager';    // Require manager approval

export interface SubstitutionResult {
  canSubstitute: boolean;
  selectedSubstitute?: SubstituteIngredient;
  availableQuantity: number;
  costDifference: number;
  requiresApproval: boolean;
}

export function findSubstitution(params: SubstitutionParams): SubstitutionResult {
  const { originalProduct, substitutes, availableBatches, policy } = params;

  if (policy === 'never' || substitutes.length === 0) {
    return {
      canSubstitute: false,
      availableQuantity: 0,
      costDifference: 0,
      requiresApproval: false,
    };
  }

  // Sort substitutes by priority
  const sortedSubstitutes = [...substitutes].sort((a, b) => a.priority - b.priority);

  for (const substitute of sortedSubstitutes) {
    const batches = availableBatches.get(substitute.productDocumentId) || [];
    const availableStock = batches.reduce((sum, b) => sum + b.netAvailable, 0);
    const requiredSubstituteQty = originalProduct.requiredQuantity * substitute.conversionRatio;

    if (availableStock >= requiredSubstituteQty) {
      const costDifference = (substitute.costMultiplier - 1) * 100; // As percentage

      // Check policy
      if (policy === 'same_cost' && substitute.costMultiplier > 1) {
        continue; // Skip more expensive substitutes
      }

      return {
        canSubstitute: true,
        selectedSubstitute: substitute,
        availableQuantity: availableStock,
        costDifference,
        requiresApproval: policy === 'ask_manager',
      };
    }
  }

  return {
    canSubstitute: false,
    availableQuantity: 0,
    costDifference: 0,
    requiresApproval: false,
  };
}

// ==========================================
// BOM CONSUMPTION ORCHESTRATOR
// ==========================================

export async function consumeBOMForOrder(
  bom: BOM,
  portions: number,
  batches: Map<string, StorageBatch[]>,
  yieldProfiles: Map<string, YieldProfile>,
  orderContext: { orderDocumentId: string; orderItemDocumentId: string },
  substitutionPolicy: SubstitutionPolicy = 'same_cost'
): Promise<ConsumptionResult> {
  const consumedBatches: ConsumedBatch[] = [];
  const substitutions: SubstitutionUsed[] = [];
  const variances: VarianceRecord[] = [];
  const errors: ConsumptionError[] = [];
  let totalCost = 0;

  for (const ingredient of bom.ingredients) {
    const requiredQuantity = ingredient.requiredQuantity * portions;
    const productBatches = batches.get(ingredient.productDocumentId) || [];
    const yieldProfile = yieldProfiles.get(ingredient.yieldProfileId || '');

    // Try FIFO consumption
    const fifoResult = consumeFIFO({
      productDocumentId: ingredient.productDocumentId,
      requiredQuantity,
      yieldProfile,
      processChain: ingredient.processChain,
      availableBatches: productBatches,
      orderContext,
    });

    if (fifoResult.success) {
      // Record consumed batches
      for (const consumed of fifoResult.consumedBatches) {
        consumedBatches.push({
          batchDocumentId: consumed.batch.documentId,
          batchSlug: consumed.batch.slug,
          productDocumentId: ingredient.productDocumentId,
          productName: ingredient.productName,
          quantity: consumed.grossQuantity,
          netQuantity: consumed.netQuantity,
          unitCost: consumed.batch.unitCost,
          totalCost: consumed.cost,
          expiryDate: consumed.batch.expiryDate,
          batchNumber: consumed.batch.batchNumber,
        });
      }
      totalCost += fifoResult.totalCost;
    } else if (!ingredient.isOptional) {
      // Try substitution
      if (ingredient.substitutes && ingredient.substitutes.length > 0) {
        const subResult = findSubstitution({
          originalProduct: {
            documentId: ingredient.productDocumentId,
            name: ingredient.productName,
            requiredQuantity,
          },
          substitutes: ingredient.substitutes,
          availableBatches: batches,
          policy: substitutionPolicy,
        });

        if (subResult.canSubstitute && subResult.selectedSubstitute) {
          // Consume substitute
          const subBatches = batches.get(subResult.selectedSubstitute.productDocumentId) || [];
          const subYieldProfile = yieldProfiles.get(ingredient.yieldProfileId || '');
          const subQuantity = requiredQuantity * subResult.selectedSubstitute.conversionRatio;

          const subFifoResult = consumeFIFO({
            productDocumentId: subResult.selectedSubstitute.productDocumentId,
            requiredQuantity: subQuantity,
            yieldProfile: subYieldProfile,
            processChain: ingredient.processChain,
            availableBatches: subBatches,
            orderContext,
          });

          if (subFifoResult.success) {
            for (const consumed of subFifoResult.consumedBatches) {
              consumedBatches.push({
                batchDocumentId: consumed.batch.documentId,
                batchSlug: consumed.batch.slug,
                productDocumentId: subResult.selectedSubstitute.productDocumentId,
                productName: subResult.selectedSubstitute.productName,
                quantity: consumed.grossQuantity,
                netQuantity: consumed.netQuantity,
                unitCost: consumed.batch.unitCost,
                totalCost: consumed.cost,
                expiryDate: consumed.batch.expiryDate,
                batchNumber: consumed.batch.batchNumber,
              });
            }

            substitutions.push({
              originalProductId: ingredient.productDocumentId,
              originalProductName: ingredient.productName,
              substituteProductId: subResult.selectedSubstitute.productDocumentId,
              substituteProductName: subResult.selectedSubstitute.productName,
              quantity: subQuantity,
              reason: 'insufficient_stock',
              costDifference: subResult.costDifference,
            });

            totalCost += subFifoResult.totalCost;
          } else {
            errors.push({
              code: 'INSUFFICIENT_STOCK',
              message: `Insufficient stock for ${ingredient.productName} and substitutes`,
              productDocumentId: ingredient.productDocumentId,
              productName: ingredient.productName,
              requiredQuantity,
              availableQuantity: fifoResult.totalGross,
            });
          }
        } else {
          errors.push({
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock for ${ingredient.productName}`,
            productDocumentId: ingredient.productDocumentId,
            productName: ingredient.productName,
            requiredQuantity,
            availableQuantity: fifoResult.totalGross,
          });
        }
      } else {
        errors.push({
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for ${ingredient.productName}`,
          productDocumentId: ingredient.productDocumentId,
          productName: ingredient.productName,
          requiredQuantity,
          availableQuantity: fifoResult.totalGross,
        });
      }
    }
  }

  return {
    success: errors.length === 0,
    consumedBatches,
    totalCost,
    costPerPortion: portions > 0 ? totalCost / portions : 0,
    substitutions,
    variances,
    errors,
  };
}

// ==========================================
// VARIANCE TRACKING
// ==========================================

export interface VarianceCheckParams {
  productDocumentId: string;
  productName: string;
  expectedOutput: number;
  actualOutput: number;
  processType?: ProcessType;
  tolerancePercent: number;
}

export function checkVariance(params: VarianceCheckParams): VarianceRecord {
  const {
    productDocumentId,
    productName,
    expectedOutput,
    actualOutput,
    processType,
    tolerancePercent,
  } = params;

  const varianceQuantity = actualOutput - expectedOutput;
  const variancePercent = expectedOutput > 0
    ? (varianceQuantity / expectedOutput) * 100
    : 0;
  const withinTolerance = Math.abs(variancePercent) <= tolerancePercent;

  return {
    productDocumentId,
    productName,
    expectedQuantity: expectedOutput,
    actualQuantity: actualOutput,
    varianceQuantity,
    variancePercent,
    withinTolerance,
    processType,
  };
}

// ==========================================
// WRITE-OFF GENERATION
// ==========================================

export interface WriteOffFromConsumption {
  documentId: string;
  batchDocumentId: string;
  productDocumentId: string;
  productName: string;
  quantity: number;
  unit: string;
  reason: ExtendedWriteOffReason;
  reasonDetails: string;
  orderDocumentId: string;
  orderItemDocumentId: string;
  costImpact: number;
  timestamp: string;
  operatorId: string;
  operatorName: string;
}

export function generateWriteOffs(
  consumedBatches: ConsumedBatch[],
  variances: VarianceRecord[],
  orderContext: { orderDocumentId: string; orderItemDocumentId: string },
  operator: { id: string; name: string }
): WriteOffFromConsumption[] {
  const writeOffs: WriteOffFromConsumption[] = [];

  // Generate write-offs for variances
  for (const variance of variances) {
    if (variance.varianceQuantity < 0) {
      // Negative variance = more waste than expected
      const wasteAmount = Math.abs(variance.varianceQuantity);
      const batch = consumedBatches.find(
        (b) => b.productDocumentId === variance.productDocumentId
      );

      if (batch) {
        writeOffs.push({
          documentId: `wo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          batchDocumentId: batch.batchDocumentId,
          productDocumentId: variance.productDocumentId,
          productName: variance.productName,
          quantity: wasteAmount,
          unit: 'kg',
          reason: 'cooking_loss',
          reasonDetails: `Yield variance: ${variance.variancePercent.toFixed(1)}% below expected`,
          orderDocumentId: orderContext.orderDocumentId,
          orderItemDocumentId: orderContext.orderItemDocumentId,
          costImpact: wasteAmount * batch.unitCost,
          timestamp: new Date().toISOString(),
          operatorId: operator.id,
          operatorName: operator.name,
        });
      }
    }
  }

  return writeOffs;
}

// ==========================================
// COST CALCULATION EXAMPLES
// ==========================================

/*
Example 1: Simple salad
- Lettuce: 100g @ ₴20/kg, yield 90% = 111g gross, ₴2.22
- Tomatoes: 80g @ ₴35/kg, yield 95% = 84g gross, ₴2.94
- Chicken: 150g @ ₴180/kg, yield 72% cleaning + 85% grill = 245g gross, ₴44.10
Total cost: ₴49.26 per portion

Example 2: With substitution
- Salmon (out of stock) → Trout (substitute, 1.1x conversion)
- Required: 200g salmon
- Use: 220g trout @ ₴280/kg = ₴61.60
- Cost difference: +10%
*/
