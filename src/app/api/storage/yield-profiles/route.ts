import { NextResponse } from 'next/server';
import type { YieldProfile } from '@/types/extended';

export async function GET() {
  try {
    // Mock yield profiles
    const profiles: YieldProfile[] = [
      {
        documentId: 'yield_beef',
        slug: 'yield-beef',
        name: 'Яловичина',
        productId: 'prod_beef',
        baseYieldRatio: 0.72,
        processYields: [
          { processType: 'cleaning', yieldRatio: 0.72 },
          { processType: 'boiling', yieldRatio: 0.65 },
          { processType: 'frying', yieldRatio: 0.60 },
        ],
        wasteBreakdown: [
          { name: 'Жир', percentage: 15, disposalType: 'trash' },
          { name: 'Кістки', percentage: 13, disposalType: 'trash' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        documentId: 'yield_chicken',
        slug: 'yield-chicken',
        name: 'Куряче філе',
        productId: 'prod_chicken',
        baseYieldRatio: 0.85,
        processYields: [
          { processType: 'cleaning', yieldRatio: 0.85 },
          { processType: 'boiling', yieldRatio: 0.75 },
          { processType: 'frying', yieldRatio: 0.70 },
        ],
        wasteBreakdown: [
          { name: 'Шкіра', percentage: 10, disposalType: 'trash' },
          { name: 'Кістки', percentage: 5, disposalType: 'trash' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        documentId: 'yield_pork',
        slug: 'yield-pork',
        name: 'Свинина',
        productId: 'prod_pork',
        baseYieldRatio: 0.80,
        processYields: [
          { processType: 'cleaning', yieldRatio: 0.80 },
          { processType: 'boiling', yieldRatio: 0.70 },
          { processType: 'frying', yieldRatio: 0.65 },
        ],
        wasteBreakdown: [
          { name: 'Жир', percentage: 12, disposalType: 'trash' },
          { name: 'Кістки', percentage: 8, disposalType: 'trash' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        documentId: 'yield_fish',
        slug: 'yield-fish',
        name: 'Риба',
        productId: 'prod_salmon',
        baseYieldRatio: 0.90,
        processYields: [
          { processType: 'cleaning', yieldRatio: 0.90 },
          { processType: 'frying', yieldRatio: 0.85 },
          { processType: 'grilling', yieldRatio: 0.80 },
        ],
        wasteBreakdown: [
          { name: 'Голова та хвіст', percentage: 8, disposalType: 'trash' },
          { name: 'Кістки', percentage: 2, disposalType: 'trash' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        documentId: 'yield_vegetables',
        slug: 'yield-vegetables',
        name: 'Овочі',
        productId: 'prod_carrot',
        baseYieldRatio: 0.88,
        processYields: [
          { processType: 'peeling', yieldRatio: 0.88 },
          { processType: 'cleaning', yieldRatio: 0.95 },
        ],
        wasteBreakdown: [
          { name: 'Шкірка', percentage: 10, disposalType: 'compost' },
          { name: 'Верхівки', percentage: 2, disposalType: 'compost' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        documentId: 'yield_potatoes',
        slug: 'yield-potatoes',
        name: 'Картопля',
        productId: 'prod_potatoes',
        baseYieldRatio: 0.85,
        processYields: [
          { processType: 'peeling', yieldRatio: 0.85 },
          { processType: 'boiling', yieldRatio: 0.95 },
          { processType: 'frying', yieldRatio: 0.75 },
        ],
        wasteBreakdown: [
          { name: 'Шкірка', percentage: 12, disposalType: 'compost' },
          { name: 'Очі', percentage: 3, disposalType: 'compost' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        documentId: 'yield_dairy',
        slug: 'yield-dairy',
        name: 'Молочні продукти',
        productId: 'prod_milk',
        baseYieldRatio: 1.0,
        processYields: [],
        wasteBreakdown: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(profiles);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch yield profiles' },
      { status: 500 }
    );
  }
}



