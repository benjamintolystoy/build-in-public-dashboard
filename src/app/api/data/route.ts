import { NextResponse } from 'next/server';
import { getDemoData } from '@/lib/api';

// In-memory store (replaced by Vercel Blob in production)
let storedData: any = null;

export async function GET() {
  const data = storedData || getDemoData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    storedData = { ...body, synced_at: new Date().toISOString() };
    return NextResponse.json({ status: 'ok', synced_at: storedData.synced_at });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
