/**
 * Batches API Route
 *
 * TODO: Connect to database
 * - GET: Fetch batches from database
 * - POST: Create new batch
 */

import { NextResponse } from 'next/server';
import type { StorageBatch } from '@/types/extended';

/**
 * GET /api/storage/batches
 *
 * Returns all storage batches.
 * TODO: Fetch from database, add filters (productId, status, dateRange)
 */
export async function GET() {
  try {
    // TODO: Replace with database query
    // Example: const batches = await db.storageBatches.findMany();
    const batches: StorageBatch[] = [];

    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/storage/batches
 *
 * Creates a new batch (receiving inventory).
 * TODO: Save to database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Replace with database insert
    // Example: const batch = await db.storageBatches.create({ data: body });
    const batch: StorageBatch = {
      documentId: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      slug: `batch-${Date.now()}`,
      ...body,
      processes: [],
      usedAmount: 0,
      wastedAmount: 0,
      status: 'received',
    };

    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
