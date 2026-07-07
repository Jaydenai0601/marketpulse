import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const history = await getHistory();
  return NextResponse.json(history);
}
