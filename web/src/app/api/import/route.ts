import { NextResponse } from 'next/server';
import { upsertDailyReport } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const report = await upsertDailyReport(payload);
    return NextResponse.json({ ok: true, id: report.id, date: report.date });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 });
  }
}
