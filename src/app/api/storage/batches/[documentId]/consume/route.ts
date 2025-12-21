import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const body = await request.json();
    // In a real app, this would update the batch in database
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to consume from batch' },
      { status: 500 }
    );
  }
}



