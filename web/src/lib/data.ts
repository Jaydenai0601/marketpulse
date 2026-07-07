import { prisma } from './prisma';

export type DailyReportWithRelations = Awaited<ReturnType<typeof getDailyReport>>;

export async function getLatestReport() {
  return prisma.dailyReport.findFirst({
    orderBy: { date: 'desc' },
    include: { sectors: true, topEvents: true },
  });
}

export async function getDailyReport(date: string) {
  return prisma.dailyReport.findUnique({
    where: { date },
    include: { sectors: true, topEvents: true },
  });
}

export async function getHistory() {
  const reports = await prisma.dailyReport.findMany({
    orderBy: { date: 'desc' },
    select: { date: true, overallScore: true, sentimentLabel: true, sectors: true },
  });
  return reports.map((r, i, arr) => {
    const prev = arr[i + 1];
    const change = prev ? r.overallScore - prev.overallScore : 0;
    const changePct = prev ? Math.round((change / prev.overallScore) * 100) : 0;
    return {
      date: r.date,
      sentiment: r.sentimentLabel,
      score: r.overallScore,
      change: `${change >= 0 ? '+' : ''}${changePct}%`,
      sectors: r.sectors.length,
    };
  });
}

export async function upsertDailyReport(payload: {
  date: string;
  overall_score: number;
  sentiment_label: string;
  news_count: number;
  bull_count: number;
  bear_count: number;
  neutral_count: number;
  sectors: { name: string; score: number; label: string; events: string[] }[];
  top_events: { title: string; sentiment: string; intensity: string; sectors: string; impact: string }[];
  report_text: string;
}) {
  return prisma.dailyReport.upsert({
    where: { date: payload.date },
    update: {
      overallScore: payload.overall_score,
      sentimentLabel: payload.sentiment_label,
      newsCount: payload.news_count,
      bullCount: payload.bull_count,
      bearCount: payload.bear_count,
      neutralCount: payload.neutral_count,
      reportText: payload.report_text,
      sectors: {
        deleteMany: {},
        create: payload.sectors.map((s) => ({
          name: s.name,
          score: s.score,
          label: s.label,
          events: JSON.stringify(s.events || []),
        })),
      },
      topEvents: {
        deleteMany: {},
        create: payload.top_events.map((e) => ({
          title: e.title,
          sentiment: e.sentiment,
          intensity: e.intensity,
          sectors: e.sectors,
          impact: e.impact,
        })),
      },
    },
    create: {
      date: payload.date,
      overallScore: payload.overall_score,
      sentimentLabel: payload.sentiment_label,
      newsCount: payload.news_count,
      bullCount: payload.bull_count,
      bearCount: payload.bear_count,
      neutralCount: payload.neutral_count,
      reportText: payload.report_text,
      sectors: {
        create: payload.sectors.map((s) => ({
          name: s.name,
          score: s.score,
          label: s.label,
          events: JSON.stringify(s.events || []),
        })),
      },
      topEvents: {
        create: payload.top_events.map((e) => ({
          title: e.title,
          sentiment: e.sentiment,
          intensity: e.intensity,
          sectors: e.sectors,
          impact: e.impact,
        })),
      },
    },
    include: { sectors: true, topEvents: true },
  });
}
