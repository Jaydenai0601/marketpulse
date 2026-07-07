import { NextResponse } from 'next/server';
import { getDailyReport } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }
  const report = await getDailyReport(date);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  return NextResponse.json(report);
}
