import { NextResponse } from 'next/server';
import { getBatches } from '@/lib/api-extended';

export async function GET() {
  try {
    const response = await getBatches();
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In a real app, this would save to database
    // For now, just return the batch with generated IDs
    return NextResponse.json({
      documentId: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      slug: `batch-${Date.now()}`,
      ...body,
      processes: [],
      usedAmount: 0,
      wastedAmount: 0,
      status: 'received',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}



