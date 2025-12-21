/**
 * Yield Calculation Utilities
 *
 * Precise calculations for raw-to-finished product conversion
 * including cleaning, boiling, frying, and rendering processes.
 */

import type {
  YieldProfile,
  ProcessYield,
  ProcessType,
  YieldVariance,
  CostImpact,
  BatchProcess,
} from '@/types/extended';

// ==========================================
// BASIC YIELD CALCULATIONS
// ==========================================

/**
 * Calculate net output after cleaning/initial processing
 *
 * Formula: netOut = grossIn × yieldRatio
 *
 * @example
 * // Banana: 2/3 flesh, 1/3 peel
 * calculateBaseYield(1.0, 0.67) // { netOut: 0.67, wasteOut: 0.33 }
 */
export function calculateBaseYield(
  grossIn: number,
  yieldRatio: number
): { netOut: number; wasteOut: number } {
  const netOut = grossIn * yieldRatio;
  const wasteOut = grossIn - netOut;

  return {
    netOut: roundToGrams(netOut),
    wasteOut: roundToGrams(wasteOut),
  };
}

/**
 * Calculate output after boiling (moisture loss)
 *
 * Formula: netAfterBoil = netIn × (1 - moistureLoss)
 *
 * Note: moistureLoss can be negative for items that absorb water
 * (e.g., pasta, rice)
 *
 * @example
 * // Beef stew: 30% moisture loss
 * calculateBoilingYield(5.0, 0.30) // { netOut: 3.5, moistureLost: 1.5 }
 *
 * // Pasta: absorbs water (negative loss)
 * calculateBoilingYield(0.5, -1.0) // { netOut: 1.0, moistureLost: -0.5 }
 */
export function calculateBoilingYield(
  netIn: number,
  moistureLoss: number
): { netOut: number; moistureLost: number } {
  const netOut = netIn * (1 - moistureLoss);
  const moistureLost = netIn - netOut;

  return {
    netOut: roundToGrams(netOut),
    moistureLost: roundToGrams(moistureLost),
  };
}

/**
 * Calculate output after frying (moisture loss + oil absorption)
 *
 * Formula: netAfterFry = netIn × (1 - moistureLoss + oilAbsorption)
 *
 * @example
 * // Deep fried chicken: 20% moisture loss, 8% oil absorption
 * calculateFryingYield(2.0, 0.20, 0.08)
 * // { netOut: 1.76, moistureLost: 0.4, oilAbsorbed: 0.16 }
 */
export function calculateFryingYield(
  netIn: number,
  moistureLoss: number,
  oilAbsorption: number
): { netOut: number; moistureLost: number; oilAbsorbed: number } {
  const moistureLost = netIn * moistureLoss;
  const oilAbsorbed = netIn * oilAbsorption;
  const netOut = netIn - moistureLost + oilAbsorbed;

  return {
    netOut: roundToGrams(netOut),
    moistureLost: roundToGrams(moistureLost),
    oilAbsorbed: roundToGrams(oilAbsorbed),
  };
}

/**
 * Calculate output after rendering (fat extraction)
 *
 * Formula: netAfterRender = grossFat × fatYield
 *
 * @example
 * // Pork lard: 80% pure fat, 10% cracklings
 * calculateRenderingYield(5.0, 0.80, 0.10)
 * // { fatOut: 4.0, cracklingsOut: 0.5, wasteOut: 0.5 }
 */
export function calculateRenderingYield(
  grossFat: number,
  fatYield: number,
  cracklingsRatio: number = 0
): { fatOut: number; cracklingsOut: number; wasteOut: number } {
  const fatOut = grossFat * fatYield;
  const cracklingsOut = grossFat * cracklingsRatio;
  const wasteOut = grossFat - fatOut - cracklingsOut;

  return {
    fatOut: roundToGrams(fatOut),
    cracklingsOut: roundToGrams(cracklingsOut),
    wasteOut: roundToGrams(Math.max(0, wasteOut)),
  };
}

// ==========================================
// CHAINED PROCESS CALCULATIONS
// ==========================================

/**
 * Calculate total yield through multiple processes
 *
 * Formula: totalYield = yieldRatio × processYield₁ × processYield₂ × ...
 *
 * @example
 * // Beef tenderloin: 72% cleaning, 85% grilling
 * calculateChainedYield(10.0, 0.72, [{ yieldRatio: 0.85 }])
 * // { netFinal: 6.12, totalYieldRatio: 0.612 }
 */
export function calculateChainedYield(
  grossIn: number,
  baseYieldRatio: number,
  processYields: Array<{ yieldRatio: number }>
): { netFinal: number; totalYieldRatio: number; stages: number[] } {
  const stages: number[] = [grossIn];

  let current = grossIn * baseYieldRatio;
  stages.push(current);

  for (const process of processYields) {
    current = current * process.yieldRatio;
    stages.push(roundToGrams(current));
  }

  const totalYieldRatio = current / grossIn;

  return {
    netFinal: roundToGrams(current),
    totalYieldRatio: roundToFourDecimals(totalYieldRatio),
    stages,
  };
}

/**
 * Calculate yield for a specific process type
 */
export function calculateProcessYield(
  netIn: number,
  processType: ProcessType,
  processYield: ProcessYield
): { netOut: number; details: Record<string, number> } {
  switch (processType) {
    case 'cleaning':
      return {
        ...calculateBaseYield(netIn, processYield.yieldRatio),
        details: { yieldRatio: processYield.yieldRatio },
      };

    case 'boiling':
      const boilResult = calculateBoilingYield(
        netIn,
        processYield.moistureLoss ?? 0
      );
      return {
        netOut: boilResult.netOut,
        details: {
          moistureLoss: processYield.moistureLoss ?? 0,
          moistureLost: boilResult.moistureLost,
        },
      };

    case 'frying':
      const fryResult = calculateFryingYield(
        netIn,
        processYield.moistureLoss ?? 0,
        processYield.oilAbsorption ?? 0
      );
      return {
        netOut: fryResult.netOut,
        details: {
          moistureLoss: processYield.moistureLoss ?? 0,
          oilAbsorption: processYield.oilAbsorption ?? 0,
          moistureLost: fryResult.moistureLost,
          oilAbsorbed: fryResult.oilAbsorbed,
        },
      };

    case 'rendering':
      const renderResult = calculateRenderingYield(
        netIn,
        processYield.yieldRatio,
        0.1 // Default cracklings ratio
      );
      return {
        netOut: renderResult.fatOut,
        details: {
          fatYield: processYield.yieldRatio,
          cracklingsOut: renderResult.cracklingsOut,
          wasteOut: renderResult.wasteOut,
        },
      };

    case 'grilling':
    case 'baking':
      // Similar to boiling - moisture loss only
      const grillResult = calculateBoilingYield(
        netIn,
        processYield.moistureLoss ?? 0.15
      );
      return {
        netOut: grillResult.netOut,
        details: {
          moistureLoss: processYield.moistureLoss ?? 0.15,
          moistureLost: grillResult.moistureLost,
        },
      };

    case 'portioning':
      // No loss, just dividing
      return {
        netOut: netIn,
        details: { yieldRatio: 1 },
      };

    default:
      return {
        netOut: netIn * processYield.yieldRatio,
        details: { yieldRatio: processYield.yieldRatio },
      };
  }
}

// ==========================================
// VARIANCE TRACKING
// ==========================================

/**
 * Calculate variance between expected and actual yield
 *
 * @param tolerancePercent - Acceptable variance (default 5%)
 */
export function calculateVariance(
  expectedYieldRatio: number,
  grossInput: number,
  actualNetOutput: number,
  tolerancePercent: number = 5
): YieldVariance {
  const expectedNet = grossInput * expectedYieldRatio;
  const actualYieldRatio = actualNetOutput / grossInput;
  const varianceKg = actualNetOutput - expectedNet;
  const variancePercent =
    expectedYieldRatio > 0
      ? ((actualYieldRatio - expectedYieldRatio) / expectedYieldRatio) * 100
      : 0;

  return {
    expectedYield: roundToFourDecimals(expectedYieldRatio),
    actualYield: roundToFourDecimals(actualYieldRatio),
    varianceKg: roundToGrams(varianceKg),
    variancePercent: roundToTwoDecimals(variancePercent),
    withinTolerance: Math.abs(variancePercent) <= tolerancePercent,
  };
}

/**
 * Generate alert if variance exceeds threshold
 */
export function checkYieldAlert(
  variance: YieldVariance
): { severity: 'warning' | 'critical'; message: string } | null {
  if (variance.withinTolerance) {
    return null;
  }

  const direction = variance.variancePercent > 0 ? 'вище' : 'нижче';
  const absVariance = Math.abs(variance.variancePercent).toFixed(1);

  if (Math.abs(variance.variancePercent) > 10) {
    return {
      severity: 'critical',
      message: `Вихід ${absVariance}% ${direction} очікуваного. Потрібна перевірка.`,
    };
  }

  return {
    severity: 'warning',
    message: `Вихід ${absVariance}% ${direction} очікуваного.`,
  };
}

// ==========================================
// COST IMPACT CALCULATIONS
// ==========================================

/**
 * Calculate impact on dish cost when yield changes
 */
export function calculateCostImpact(
  batchCost: number,
  expectedYield: number,
  actualYield: number,
  portionSize: number,
  grossInput: number
): CostImpact {
  const expectedNet = grossInput * expectedYield;
  const actualNet = grossInput * actualYield;

  const expectedPortions = expectedNet / portionSize;
  const actualPortions = actualNet / portionSize;

  const originalCostPerPortion =
    expectedPortions > 0 ? batchCost / expectedPortions : 0;
  const adjustedCostPerPortion =
    actualPortions > 0 ? batchCost / actualPortions : 0;

  const impactPercent =
    originalCostPerPortion > 0
      ? ((adjustedCostPerPortion - originalCostPerPortion) /
          originalCostPerPortion) *
        100
      : 0;

  return {
    originalCostPerPortion: roundToTwoDecimals(originalCostPerPortion),
    adjustedCostPerPortion: roundToTwoDecimals(adjustedCostPerPortion),
    impactPercent: roundToTwoDecimals(impactPercent),
    totalImpactPerBatch: roundToTwoDecimals(
      (adjustedCostPerPortion - originalCostPerPortion) * actualPortions
    ),
  };
}

/**
 * Calculate cost per kg after yield processing
 */
export function calculateCostPerKgNet(
  costPerKgGross: number,
  yieldRatio: number
): number {
  if (yieldRatio <= 0) return 0;
  return roundToTwoDecimals(costPerKgGross / yieldRatio);
}

// ==========================================
// BATCH PROCESSING HELPERS
// ==========================================

/**
 * Create a batch process record with variance calculation
 */
export function createBatchProcess(
  processType: ProcessType,
  grossInput: number,
  actualNetOutput: number,
  yieldProfile: YieldProfile,
  operatorId: string,
  operatorName: string,
  options: {
    processTemp?: number;
    processTime?: number;
    notes?: string;
  } = {}
): Omit<BatchProcess, 'documentId'> {
  // Find the relevant process yield from profile
  const processYield = yieldProfile.processYields.find(
    (p) => p.processType === processType
  );

  // Use base yield ratio if no specific process yield found
  const expectedYieldRatio =
    processYield?.yieldRatio ?? yieldProfile.baseYieldRatio;

  const variance = calculateVariance(
    expectedYieldRatio,
    grossInput,
    actualNetOutput
  );

  const wasteOutput = grossInput - actualNetOutput;

  return {
    processType,
    processedAt: new Date().toISOString(),
    operatorId,
    operatorName,
    grossInput: roundToGrams(grossInput),
    netOutput: roundToGrams(actualNetOutput),
    wasteOutput: roundToGrams(Math.max(0, wasteOutput)),
    moistureLoss: processYield?.moistureLoss,
    oilAbsorption: processYield?.oilAbsorption,
    processTemp: options.processTemp,
    processTime: options.processTime,
    expectedYield: variance.expectedYield,
    actualYield: variance.actualYield,
    variancePercent: variance.variancePercent,
    notes: options.notes,
  };
}

/**
 * Calculate expected output for a given process
 */
export function getExpectedOutput(
  grossInput: number,
  processType: ProcessType,
  yieldProfile: YieldProfile
): number {
  // First apply base yield (cleaning)
  let current = grossInput * yieldProfile.baseYieldRatio;

  // Then apply specific process
  const processYield = yieldProfile.processYields.find(
    (p) => p.processType === processType
  );

  if (processYield) {
    if (processYield.moistureLoss !== undefined) {
      current = current * (1 - processYield.moistureLoss);
    }
    if (processYield.oilAbsorption !== undefined) {
      current = current * (1 + processYield.oilAbsorption);
    }
    if (
      processYield.moistureLoss === undefined &&
      processYield.oilAbsorption === undefined
    ) {
      current = current * processYield.yieldRatio;
    }
  }

  return roundToGrams(current);
}

/**
 * Get total yield ratio for a product after all typical processes
 */
export function getTotalYieldRatio(yieldProfile: YieldProfile): number {
  let total = yieldProfile.baseYieldRatio;

  for (const process of yieldProfile.processYields) {
    if (process.moistureLoss !== undefined) {
      total *= 1 - process.moistureLoss;
    }
    if (process.oilAbsorption !== undefined) {
      total *= 1 + process.oilAbsorption;
    }
  }

  return roundToFourDecimals(total);
}

// ==========================================
// YIELD APPLICATION HELPERS
// ==========================================

/**
 * Apply yield ratio to quantity
 * Used for FIFO consumption calculations
 */
export function applyYieldToQuantity(
  grossQuantity: number,
  yieldProfile: YieldProfile | undefined
): number {
  if (!yieldProfile) {
    return grossQuantity;
  }
  return roundToGrams(grossQuantity * getTotalYieldRatio(yieldProfile));
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Round to grams (3 decimal places for kg)
 */
function roundToGrams(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Round to 2 decimal places (for currency)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Round to 4 decimal places (for ratios)
 */
function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/**
 * Convert between units
 */
export function convertUnits(
  value: number,
  from: 'kg' | 'g' | 'l' | 'ml',
  to: 'kg' | 'g' | 'l' | 'ml'
): number {
  const conversions: Record<string, number> = {
    'kg-g': 1000,
    'g-kg': 0.001,
    'l-ml': 1000,
    'ml-l': 0.001,
    'kg-kg': 1,
    'g-g': 1,
    'l-l': 1,
    'ml-ml': 1,
  };

  const key = `${from}-${to}`;
  const factor = conversions[key];

  if (factor === undefined) {
    throw new Error(`Cannot convert from ${from} to ${to}`);
  }

  return value * factor;
}

// ==========================================
// EXAMPLE YIELD PROFILES
// ==========================================

export const EXAMPLE_YIELD_PROFILES: Omit<YieldProfile, 'documentId'>[] = [
  {
    slug: 'banana-standard',
    name: 'Banana Standard',
    productId: 'prod_banana',
    baseYieldRatio: 0.67,
    processYields: [],
    wasteBreakdown: [
      { name: 'peel', percentage: 0.33, disposalType: 'compost' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    slug: 'beef-tenderloin-premium',
    name: 'Beef Tenderloin Premium',
    productId: 'prod_beef_tenderloin',
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
  {
    slug: 'potato-standard',
    name: 'Potato Standard',
    productId: 'prod_potato',
    baseYieldRatio: 0.8,
    processYields: [
      {
        processType: 'boiling',
        yieldRatio: 0.95,
        moistureLoss: 0.05,
        temperatureRange: [95, 100],
        timeRange: [20, 30],
      },
      {
        processType: 'frying',
        yieldRatio: 0.75,
        moistureLoss: 0.35,
        oilAbsorption: 0.1,
        temperatureRange: [170, 180],
        timeRange: [5, 10],
      },
    ],
    wasteBreakdown: [
      { name: 'peel', percentage: 0.15, disposalType: 'compost' },
      { name: 'eyes', percentage: 0.05, disposalType: 'trash' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
