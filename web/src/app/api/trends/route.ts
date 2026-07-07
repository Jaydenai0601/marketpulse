import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reports = await prisma.dailyReport.findMany({
    orderBy: { date: 'asc' },
    include: { sectors: true },
  });

  const dates = reports.map((r) => r.date.slice(5));
  const overall = reports.map((r) => r.overallScore);

  const sectorNames = Array.from(new Set(reports.flatMap((r) => r.sectors.map((s) => s.name))));
  const sectors: Record<string, (number | null)[]> = {};
  sectorNames.forEach((name) => {
    sectors[name] = reports.map((r) => {
      const s = r.sectors.find((x) => x.name === name);
      return s ? s.score : null;
    });
  });

  return NextResponse.json({ dates, overall, sectors });
}
